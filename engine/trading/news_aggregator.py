"""
News Aggregator — the "most powerful news" engine.

Pulls headlines for each company (and the broad market) from multiple sources,
scores each with VADER sentiment, and ranks them by a composite POWER SCORE so
the strongest, most market-moving stories float to the top.

Sources (all free / keyless unless noted):
  • Finnhub company-news + general market news      (uses existing client)
  • Reddit search RSS  (r/stocks, r/wallstreetbets) (keyless)
  • Configurable RSS feeds (Reuters, CNBC, …)       (keyless, engine/config.py)
  • X / Twitter social feed (Walter Bloomberg, etc.) (PAID — dormant until you
    set X_BEARER_TOKEN; then breaking headlines appear automatically)

Power score = recency_weight × source_weight × (0.4 + 0.6 × |sentiment|)
so a fresh headline from a high-authority source with a strong sentiment
charge ranks highest. Everything is cached in the api_cache SQLite table.

Educational/research output — not financial advice.
"""
import json
import re
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus
from xml.etree import ElementTree as ET

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except Exception:
    VADER_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except Exception:
    REQUESTS_AVAILABLE = False

from engine.config import RSS_FEEDS, X_BEARER_TOKEN, X_NEWS_HANDLES
from engine.trading import finnhub_client as finnhub

DB_PATH = "jarvis.db"
_UA = {"User-Agent": "Mozilla/5.0 (JARVIS news aggregator)"}

# How authoritative / market-moving each source is (0..1).
SOURCE_WEIGHT = {
    "X": 1.0,            # instant breaking (Walter Bloomberg / squawk)
    "Reuters": 0.95,
    "Bloomberg": 0.95,
    "CNBC": 0.85,
    "MarketWatch": 0.8,
    "Yahoo Finance": 0.7,
    "Finnhub": 0.75,
    "Reddit": 0.55,
    "RSS": 0.7,
}

_analyzer = None


def _vader(text: str) -> float:
    global _analyzer
    if not VADER_AVAILABLE or not text:
        return 0.0
    if _analyzer is None:
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer.polarity_scores(text)["compound"]


# ── cache helpers (reuse api_cache table) ───────────────────────────────────────

def _cache_get(key: str, ttl: int):
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute("SELECT payload, fetched_at FROM api_cache WHERE cache_key=?", (key,))
        row = cur.fetchone()
        con.close()
        if not row:
            return None
        payload, fetched_at = row
        if datetime.now() - datetime.fromisoformat(fetched_at) > timedelta(seconds=ttl):
            return None
        return json.loads(payload)
    except Exception:
        return None


def _cache_set(key: str, value) -> None:
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute(
            """INSERT INTO api_cache (cache_key, payload, fetched_at)
               VALUES (?, ?, datetime('now'))
               ON CONFLICT(cache_key) DO UPDATE SET
                   payload=excluded.payload, fetched_at=datetime('now')""",
            (key, json.dumps(value)),
        )
        con.commit()
        con.close()
    except Exception:
        pass


# ── scoring ─────────────────────────────────────────────────────────────────────

def _recency_weight(ts: float) -> float:
    """1.0 for brand-new, decaying to ~0.3 over 3 days."""
    if not ts:
        return 0.6
    age_h = max(0.0, (time.time() - ts) / 3600.0)
    if age_h <= 2:
        return 1.0
    if age_h >= 72:
        return 0.3
    return 1.0 - 0.7 * (age_h - 2) / 70.0


def _power_score(source: str, sentiment: float, ts: float) -> float:
    sw = SOURCE_WEIGHT.get(source, 0.6)
    rw = _recency_weight(ts)
    charge = 0.4 + 0.6 * min(abs(sentiment), 1.0)
    return round(sw * rw * charge, 4)


def _label(sentiment: float) -> str:
    if sentiment >= 0.35:
        return "bullish"
    if sentiment <= -0.35:
        return "bearish"
    return "neutral"


def _mk(headline, url, source, ts, summary=""):
    s = _vader((headline or "") + ". " + (summary or ""))
    return {
        "headline": (headline or "").strip(),
        "summary": (summary or "").strip()[:280],
        "url": url or "",
        "source": source,
        "ts": ts or 0,
        "datetime": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else "",
        "sentiment": round(s, 3),
        "label": _label(s),
        "power": _power_score(source, s, ts),
    }


# ── source: Finnhub ─────────────────────────────────────────────────────────────

def _finnhub_company(ticker: str, limit: int = 20) -> list:
    out = []
    rows = finnhub.get_company_news(ticker, days=7) if finnhub.is_configured() else None
    for n in (rows or [])[:limit]:
        out.append(_mk(n.get("headline"), n.get("url"), "Finnhub",
                       n.get("datetime", 0), n.get("summary", "")))
    return out


def _finnhub_market(limit: int = 30) -> list:
    out = []
    rows = finnhub.get_market_news("general") if finnhub.is_configured() else None
    for n in (rows or [])[:limit]:
        src = n.get("source") or "Finnhub"
        # Normalise well-known sources so they get the right authority weight.
        for known in ("Reuters", "Bloomberg", "CNBC", "MarketWatch", "Yahoo"):
            if known.lower() in src.lower():
                src = "Yahoo Finance" if known == "Yahoo" else known
                break
        else:
            src = "Finnhub"
        out.append(_mk(n.get("headline"), n.get("url"), src,
                       n.get("datetime", 0), n.get("summary", "")))
    return out


# ── source: Reddit search RSS (keyless) ─────────────────────────────────────────

def _reddit(ticker: str, limit: int = 8) -> list:
    if not REQUESTS_AVAILABLE:
        return []
    out = []
    url = ("https://www.reddit.com/r/stocks+wallstreetbets+investing/search.rss"
           f"?q={quote_plus(ticker)}&restrict_sr=1&sort=new&t=week")
    try:
        r = requests.get(url, headers=_UA, timeout=8)
        if r.status_code != 200:
            return []
        root = ET.fromstring(r.content)
        ns = {"a": "http://www.w3.org/2005/Atom"}
        for entry in root.findall("a:entry", ns)[:limit]:
            title = entry.findtext("a:title", default="", namespaces=ns)
            link_el = entry.find("a:link", ns)
            link = link_el.get("href") if link_el is not None else ""
            updated = entry.findtext("a:updated", default="", namespaces=ns)
            ts = _parse_iso(updated)
            out.append(_mk(title, link, "Reddit", ts))
    except Exception:
        return []
    return out


# ── source: RSS feeds (keyless) ─────────────────────────────────────────────────

def _rss_feed(name: str, url: str, limit: int = 12, match: str = "") -> list:
    if not REQUESTS_AVAILABLE:
        return []
    out = []
    try:
        r = requests.get(url, headers=_UA, timeout=8)
        if r.status_code != 200:
            return []
        root = ET.fromstring(r.content)
        items = root.findall(".//item")[:40]
        src = "Reuters" if "reuters" in name.lower() else (
            "CNBC" if "cnbc" in name.lower() else (
            "MarketWatch" if "marketwatch" in name.lower() else (
            "Yahoo Finance" if "yahoo" in name.lower() else "RSS")))
        for it in items:
            title = (it.findtext("title") or "").strip()
            link = (it.findtext("link") or "").strip()
            desc = re.sub("<[^>]+>", "", it.findtext("description") or "")
            ts = _parse_rfc822(it.findtext("pubDate") or "")
            if match and match.lower() not in (title + " " + desc).lower():
                continue
            out.append(_mk(title, link, src, ts, desc))
            if len(out) >= limit:
                break
    except Exception:
        return []
    return out


# ── source: X / Twitter (free user-timeline endpoint) ────────────────────────────
#
# Uses GET /2/users/:id/tweets — available on the free X API tier.
# Breaking-news sources + market-moving CEOs are all covered.
# Handles with a None ID are resolved once via /2/users/by/username/:handle
# and cached for 30 days, so no hard-coded guessing is needed.

_X_TOKEN_CACHE_ID = "__x_bearer_token__"
_x_runtime = [None]

# Static IDs for high-frequency breaking-news accounts (avoids an extra lookup).
# CEO handles are resolved dynamically on first use and cached in the DB.
_X_USER_IDS: dict = {
    # ── Breaking news ─────────────────────────────────────────────
    "DeItaone":         233682977,
    "WalterBloomberg":  None,
    "FirstSquawk":      1628122394,
    "Reuters":          1652541,
    "realDonaldTrump":  25073877,
    # ── High-impact CEOs ──────────────────────────────────────────
    "elonmusk":         44196397,   # Tesla / X
    "tim_cook":         None,       # Apple
    "satyanadella":     None,       # Microsoft
    "sundarpichai":     None,       # Google / Alphabet
    "zuck":             None,       # Meta
    "ajassy":           None,       # Amazon
    "jensenhuang":      None,       # NVIDIA
    "LisaSu":           None,       # AMD
}


def _load_persisted_x() -> str:
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute("SELECT payload FROM api_cache WHERE cache_key=?", (_X_TOKEN_CACHE_ID,))
        row = cur.fetchone()
        con.close()
        if row and row[0]:
            return (json.loads(row[0]) or "").strip()
    except Exception:
        pass
    return ""


def _x_token() -> str:
    if _x_runtime[0] is None:
        _x_runtime[0] = _load_persisted_x()
    return (_x_runtime[0] or X_BEARER_TOKEN or "").strip()


def _clear_news_cache() -> None:
    """Drop cached news so the next pull re-blends with the new source."""
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute("DELETE FROM api_cache WHERE cache_key LIKE 'news:%'")
        con.commit()
        con.close()
    except Exception:
        pass


def _resolve_user_id(handle: str, token: str) -> int | None:
    """
    Look up a numeric X user ID by @handle using the free username endpoint.
    Result is cached for 30 days so each handle is resolved at most once.
    """
    cache_key = f"x:uid:{handle.lower()}"
    cached = _cache_get(cache_key, 30 * 24 * 3600)
    if cached and cached.get("id"):
        return int(cached["id"])
    if not REQUESTS_AVAILABLE:
        return None
    try:
        r = requests.get(
            f"https://api.twitter.com/2/users/by/username/{handle}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )
        if r.status_code == 200:
            uid = r.json().get("data", {}).get("id")
            if uid:
                _cache_set(cache_key, {"id": uid})
                return int(uid)
    except Exception:
        pass
    return None


def set_x_token(token: str) -> dict:
    """
    Save an X / Twitter bearer token at runtime (from the Settings UI).
    Persists to DB, clears news cache, and validates via the free user-timeline
    endpoint (no paid search tier required). Returns the updated status dict.
    """
    token = (token or "").strip()
    _x_runtime[0] = token
    # Also clear any cached user-ID lookups so they re-resolve with new token.
    try:
        con = sqlite3.connect(DB_PATH)
        cur = con.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, datetime('now'))",
            (_X_TOKEN_CACHE_ID, json.dumps(token)),
        )
        con.commit()
        con.close()
    except Exception as e:
        print("[news] could not persist X token:", e)

    _clear_news_cache()
    st = status()
    if token and REQUESTS_AVAILABLE:
        # Validate using the free user-timeline endpoint (Reuters, known ID).
        try:
            r = requests.get(
                "https://api.twitter.com/2/users/1652541/tweets",
                headers={"Authorization": f"Bearer {token}"},
                params={"max_results": 5},
                timeout=8,
            )
            if r.status_code == 200:
                st["valid"] = True
            elif r.status_code == 429:
                st["valid"] = True
                st["message"] = "Token accepted (currently rate-limited)."
            elif r.status_code in (401, 403):
                st["valid"] = False
                st["message"] = "X token rejected (401/403). Verify the bearer token has v2 read access."
            else:
                st["valid"] = None
                st["message"] = f"Unexpected response from X ({r.status_code})."
        except Exception as e:
            st["valid"] = None
            st["message"] = f"Could not validate token: {e}"
    return st


def x_configured() -> bool:
    return bool(_x_token()) and REQUESTS_AVAILABLE


def _x_social(limit: int = 20) -> list:
    """
    Pull recent tweets from breaking-news feeds + market-moving CEOs using the
    free GET /2/users/:id/tweets endpoint (no paid search tier required).
    Returns [] when no bearer token is configured.
    """
    if not x_configured():
        return []
    token = _x_token()
    out = []
    per_user = max(5, limit // max(len(_X_USER_IDS), 1))

    for handle, uid in _X_USER_IDS.items():
        if uid is None:
            uid = _resolve_user_id(handle, token)
        if not uid:
            continue
        try:
            r = requests.get(
                f"https://api.twitter.com/2/users/{uid}/tweets",
                headers={"Authorization": f"Bearer {token}"},
                params={"max_results": per_user, "tweet.fields": "created_at"},
                timeout=10,
            )
            if r.status_code == 429:
                break   # hit rate limit — return what we have so far
            if r.status_code != 200:
                continue
            for t in r.json().get("data", []):
                ts = _parse_iso(t.get("created_at", ""))
                out.append(_mk(
                    t.get("text", ""),
                    "https://x.com/i/web/status/" + t.get("id", ""),
                    "X", ts,
                ))
        except Exception:
            continue
    return out


# ── time parsing ─────────────────────────────────────────────────────────────────

def _parse_iso(s: str) -> float:
    if not s:
        return 0
    try:
        s = s.replace("Z", "+00:00")
        return datetime.fromisoformat(s).timestamp()
    except Exception:
        return 0


def _parse_rfc822(s: str) -> float:
    if not s:
        return 0
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(s).timestamp()
    except Exception:
        return 0


def _dedupe_rank(items: list, limit: int) -> list:
    seen = set()
    uniq = []
    for it in sorted(items, key=lambda x: x["power"], reverse=True):
        key = re.sub(r"\W+", "", it["headline"].lower())[:60]
        if not key or key in seen:
            continue
        seen.add(key)
        uniq.append(it)
        if len(uniq) >= limit:
            break
    return uniq


# ── public API ────────────────────────────────────────────────────────────────

def get_company_news(ticker: str, limit: int = 12) -> dict:
    """Most powerful news for a single company, ranked by power score."""
    ticker = ticker.upper()
    cache_key = f"news:company:{ticker}:{limit}"
    cached = _cache_get(cache_key, 30 * 60)
    if cached:
        return cached

    items = []
    items += _finnhub_company(ticker)
    items += _reddit(ticker)
    # Scan one RSS feed for ticker mentions (cheap, keyless extra coverage).
    if RSS_FEEDS:
        name, url = RSS_FEEDS[0]
        items += _rss_feed(name, url, limit=6, match=ticker)
    items += [i for i in _x_social() if ticker.lower() in i["headline"].lower()]

    ranked = _dedupe_rank(items, limit)
    avg_sent = round(sum(i["sentiment"] for i in ranked) / len(ranked), 3) if ranked else 0.0
    result = {
        "ticker": ticker,
        "generated_at": datetime.now().isoformat(),
        "avg_sentiment": avg_sent,
        "label": _label(avg_sent),
        "count": len(ranked),
        "items": ranked,
        "x_active": x_configured(),
    }
    _cache_set(cache_key, result)
    return result


def get_market_news(limit: int = 20) -> dict:
    """Most powerful broad-market headlines across all sources."""
    cache_key = f"news:market:{limit}"
    cached = _cache_get(cache_key, 20 * 60)
    if cached:
        return cached

    items = []
    items += _finnhub_market()
    for name, url in RSS_FEEDS:
        items += _rss_feed(name, url, limit=10)
    items += _x_social()

    ranked = _dedupe_rank(items, limit)
    result = {
        "generated_at": datetime.now().isoformat(),
        "count": len(ranked),
        "items": ranked,
        "x_active": x_configured(),
        "sources_live": _live_sources(),
    }
    _cache_set(cache_key, result)
    return result


def get_power_news(tickers: list[str] | None = None, limit: int = 15) -> dict:
    """
    The single highest-impact feed: blends top market headlines with the most
    powerful per-ticker stories across the watchlist. This is what the
    Command Center surfaces as "POWER NEWS".
    """
    from engine.trading.tickers import get_all_tickers
    watch = [t.upper() for t in (tickers or get_all_tickers())]

    cache_key = f"news:power:{limit}:{len(watch)}"
    cached = _cache_get(cache_key, 20 * 60)
    if cached:
        return cached

    items = []
    items += _finnhub_market(limit=20)
    items += _x_social()
    for name, url in RSS_FEEDS[:2]:
        items += _rss_feed(name, url, limit=8)
    # Tag company stories from the (already cached) per-ticker pulls — cheap
    # because Finnhub company news is cached; cap the fan-out to stay fast.
    for t in watch[:12]:
        for it in _finnhub_company(t, limit=4):
            it["ticker"] = t
            items.append(it)

    ranked = _dedupe_rank(items, limit)
    result = {
        "generated_at": datetime.now().isoformat(),
        "count": len(ranked),
        "items": ranked,
        "x_active": x_configured(),
        "sources_live": _live_sources(),
    }
    _cache_set(cache_key, result)
    return result


def _live_sources() -> list[str]:
    live = []
    if finnhub.is_configured():
        live.append("Finnhub")
    if REQUESTS_AVAILABLE:
        live += ["Reddit", "RSS"]
    if x_configured():
        live.append("X")
    return live


def status() -> dict:
    return {
        "finnhub": finnhub.is_configured(),
        "rss": REQUESTS_AVAILABLE and bool(RSS_FEEDS),
        "reddit": REQUESTS_AVAILABLE,
        "x": x_configured(),
        "x_handles": list(_X_USER_IDS.keys()) if x_configured() else [],
        "vader": VADER_AVAILABLE,
        "live_sources": _live_sources(),
    }
