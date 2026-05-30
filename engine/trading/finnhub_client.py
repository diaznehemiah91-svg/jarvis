"""
Finnhub API client — real market data on the free tier.

Free endpoints used:
  • /quote                       real-time price (current/open/high/low/prev-close)
  • /stock/recommendation        analyst buy/hold/sell trends  → analyst bias
  • /company-news                recent headlines              → news sentiment
  • /stock/insider-transactions  insider buys/sells            → real smart money

Features:
  • SQLite-backed response cache with per-endpoint TTL (respects rate limits)
  • Throttle to stay under the free 60 calls/min ceiling
  • Graceful: returns None on any failure (no key, offline, rate-limited),
    so callers fall back to the local simulation.

Docs: https://finnhub.io/docs/api
"""
import json
import sqlite3
import time
from datetime import datetime, timedelta
from urllib.parse import urlencode

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from engine.config import FINNHUB_KEY

BASE = "https://finnhub.io/api/v1"
DB_PATH = "jarvis.db"

# Stay safely under 60 req/min on the free tier.
_MIN_INTERVAL = 1.05
_last_call = [0.0]

# TTLs (seconds)
TTL_QUOTE = 60
TTL_RECOMMENDATION = 12 * 3600
TTL_NEWS = 2 * 3600
TTL_INSIDER = 12 * 3600
TTL_MARKET_NEWS = 30 * 60
TTL_SYMBOL_SEARCH = 24 * 3600
TTL_SYMBOLS = 7 * 24 * 3600


# Runtime key override (set from the Settings UI). Takes precedence over the
# config/env key and is persisted in the api_cache table so it survives restarts.
_runtime_key = [None]  # boxed so it can be mutated from helpers
_KEY_CACHE_ID = "__finnhub_api_key__"


def _load_persisted_key() -> str:
    """Read a previously saved key from the DB (set via the Settings panel)."""
    try:
        con = _con()
        cur = con.cursor()
        cur.execute("SELECT payload FROM api_cache WHERE cache_key=?", (_KEY_CACHE_ID,))
        row = cur.fetchone()
        con.close()
        if row and row[0]:
            return (json.loads(row[0]) or "").strip()
    except Exception:
        pass
    return ""


def _key() -> str:
    # Priority: runtime override → persisted (DB) → config/env.
    if _runtime_key[0] is None:
        _runtime_key[0] = _load_persisted_key()
    return (_runtime_key[0] or FINNHUB_KEY or "").strip()


def set_key(key: str) -> dict:
    """
    Save a Finnhub API key supplied at runtime (from the Settings UI).
    Persists to the DB so it survives a restart, and validates it with a
    lightweight live quote call. Returns the updated status dict.
    """
    key = (key or "").strip()
    _runtime_key[0] = key
    # Persist (or clear) in the cache table.
    try:
        con = _con()
        cur = con.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)",
            (_KEY_CACHE_ID, json.dumps(key), datetime.now().isoformat()),
        )
        con.commit()
        con.close()
    except Exception as e:
        print(f"[finnhub] could not persist key: {e}")

    st = status()
    # Validate with a real call if a key was provided.
    if key and REQUESTS_AVAILABLE:
        try:
            r = requests.get(
                f"{BASE}/quote",
                params={"symbol": "AAPL", "token": key},
                timeout=8,
            )
            ok = r.status_code == 200 and isinstance(r.json().get("c"), (int, float))
            st["valid"] = bool(ok)
            if r.status_code == 401 or r.status_code == 403:
                st["valid"] = False
                st["message"] = "Key rejected by Finnhub (401/403)."
        except Exception as e:
            st["valid"] = None
            st["message"] = f"Could not validate key: {e}"
    return st


def is_configured() -> bool:
    """True if a key is set and requests is importable."""
    return bool(_key()) and REQUESTS_AVAILABLE


# ── Cache ─────────────────────────────────────────────────────────────────────

def _con():
    return sqlite3.connect(DB_PATH)


def _cache_get(cache_key: str, ttl: int):
    try:
        con = _con()
        cur = con.cursor()
        cur.execute(
            "SELECT payload, fetched_at FROM api_cache WHERE cache_key=?",
            (cache_key,),
        )
        row = cur.fetchone()
        con.close()
        if not row:
            return None
        payload, fetched_at = row
        ts = datetime.fromisoformat(fetched_at)
        if datetime.now() - ts > timedelta(seconds=ttl):
            return None
        return json.loads(payload)
    except Exception:
        return None


def _cache_set(cache_key: str, value) -> None:
    try:
        con = _con()
        cur = con.cursor()
        cur.execute(
            """
            INSERT INTO api_cache (cache_key, payload, fetched_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(cache_key) DO UPDATE SET
                payload=excluded.payload, fetched_at=datetime('now')
            """,
            (cache_key, json.dumps(value)),
        )
        con.commit()
        con.close()
    except Exception:
        pass


# ── Core GET ──────────────────────────────────────────────────────────────────

def _throttle():
    dt = time.time() - _last_call[0]
    if dt < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - dt)
    _last_call[0] = time.time()


def _get(path: str, params: dict, ttl: int):
    cache_key = path + "?" + urlencode(sorted(params.items()))
    cached = _cache_get(cache_key, ttl)
    if cached is not None:
        return cached

    if not is_configured():
        return None

    try:
        _throttle()
        q = dict(params)
        q["token"] = _key()
        resp = requests.get(BASE + path, params=q, timeout=10)
        if resp.status_code == 429:
            print("[finnhub] rate limited (429) — backing off")
            return None
        if resp.status_code != 200:
            return None
        data = resp.json()
        _cache_set(cache_key, data)
        return data
    except Exception as e:
        print(f"[finnhub] {path} error: {e}")
        return None


# ── Public endpoints ──────────────────────────────────────────────────────────

def get_quote(ticker: str) -> dict | None:
    """Real-time quote: {c,d,dp,h,l,o,pc,t}. Returns None on failure."""
    d = _get("/quote", {"symbol": ticker}, TTL_QUOTE)
    if not d or d.get("c") in (None, 0):
        return None
    return d


def get_recommendation(ticker: str) -> list | None:
    """Analyst recommendation trends (latest first)."""
    return _get("/stock/recommendation", {"symbol": ticker}, TTL_RECOMMENDATION)


def get_company_news(ticker: str, days: int = 7) -> list | None:
    """Recent company news headlines."""
    to = datetime.now().strftime("%Y-%m-%d")
    frm = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    return _get("/company-news", {"symbol": ticker, "from": frm, "to": to}, TTL_NEWS)


def get_insider_transactions(ticker: str) -> dict | None:
    """Insider buys/sells — real institutional/insider flow."""
    return _get("/stock/insider-transactions", {"symbol": ticker}, TTL_INSIDER)


def get_market_news(category: str = "general") -> list | None:
    """Broad market news headlines (general/forex/crypto/merger)."""
    return _get("/news", {"category": category}, TTL_MARKET_NEWS)


def search_symbol(query: str) -> list | None:
    """
    Symbol lookup across the whole market. Returns matches like
    [{symbol, description, type, displaySymbol}, ...].
    """
    d = _get("/search", {"q": query}, TTL_SYMBOL_SEARCH)
    if not d:
        return None
    return d.get("result", [])


def list_symbols(exchange: str = "US") -> list | None:
    """Full tradable symbol universe for an exchange (large; cached 7 days)."""
    return _get("/stock/symbol", {"exchange": exchange}, TTL_SYMBOLS)


def company_profile(ticker: str) -> dict | None:
    """Company profile: name, industry, market cap, logo, etc."""
    return _get("/stock/profile2", {"symbol": ticker}, TTL_RECOMMENDATION)


# ── Derived signals ───────────────────────────────────────────────────────────

def analyst_bias(ticker: str) -> float | None:
    """
    Convert analyst recommendation counts into a bias in [-1, +1]:
      strongBuy=+1, buy=+0.5, hold=0, sell=-0.5, strongSell=-1
    """
    recs = get_recommendation(ticker)
    if not recs:
        return None
    r = recs[0]  # most recent period
    sb, b = r.get("strongBuy", 0), r.get("buy", 0)
    h = r.get("hold", 0)
    s, ss = r.get("sell", 0), r.get("strongSell", 0)
    total = sb + b + h + s + ss
    if total == 0:
        return None
    score = (sb * 1.0 + b * 0.5 + s * -0.5 + ss * -1.0) / total
    return max(-1.0, min(1.0, score))


def insider_flow(ticker: str) -> dict | None:
    """
    Net insider activity over recent filings.
    Returns {net_shares, buy_value, sell_value, direction, txns} or None.
    """
    data = get_insider_transactions(ticker)
    if not data or not data.get("data"):
        return None
    buy_val = sell_val = 0.0
    net_shares = 0
    txns = 0
    for t in data["data"]:
        change = t.get("change", 0) or 0
        price = t.get("transactionPrice", 0) or 0
        if change == 0:
            continue
        txns += 1
        net_shares += change
        if change > 0:
            buy_val += change * price
        else:
            sell_val += abs(change) * price
    if txns == 0:
        return None
    direction = "bullish" if net_shares > 0 else "bearish"
    return {
        "net_shares": net_shares,
        "buy_value": buy_val,
        "sell_value": sell_val,
        "direction": direction,
        "txns": txns,
    }


def status() -> dict:
    """Report whether the live Finnhub feed is active."""
    return {
        "provider": "finnhub",
        "configured": is_configured(),
        "has_key": bool(_key()),
        "requests_available": REQUESTS_AVAILABLE,
        "mode": "LIVE" if is_configured() else "SIM",
    }
