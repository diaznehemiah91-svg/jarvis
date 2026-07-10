"""
Discord integration — squawk-room feed + alert relay.

Two independent halves, each optional:

  READ  (bot token + channel ID)
    Pulls the most recent messages from a Discord channel so the trading
    room's chatter shows up live inside the JARVIS HUD.
      GET https://discord.com/api/v10/channels/{channel_id}/messages
      Authorization: Bot <token>
    The bot must be a member of the server with the "Read Message History"
    permission on the channel.

  WRITE (webhook URL)
    Relays JARVIS intelligence (HIGH/CRITICAL alerts, briefings) into a
    Discord channel as rich embeds. Webhooks need no bot — create one in
    Discord via  Channel → Settings → Integrations → Webhooks.

Without credentials the feed runs in SIM mode (synthetic squawk-room chatter
derived from the live alert stream) so the panel always renders — matching
the SIM philosophy used across the rest of the engine.

Settings persist in the api_cache table (same pattern as the Finnhub key and
X bearer token) and can also come from the environment:
  DISCORD_BOT_TOKEN / DISCORD_CHANNEL_ID / DISCORD_WEBHOOK_URL
"""
import json
import os
import random
import sqlite3
from datetime import datetime, timedelta, timezone

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

DB_PATH = "jarvis.db"
API_BASE = "https://discord.com/api/v10"

TTL_FEED = 45          # seconds between real channel fetches
FEED_CACHE_ID = "__discord_feed_cache__"
RELAY_MARK_ID = "__discord_last_relayed__"

_SETTING_IDS = {
    "webhook": "__discord_webhook__",
    "bot_token": "__discord_bot_token__",
    "channel_id": "__discord_channel_id__",
}
_ENV_NAMES = {
    "webhook": "DISCORD_WEBHOOK_URL",
    "bot_token": "DISCORD_BOT_TOKEN",
    "channel_id": "DISCORD_CHANNEL_ID",
}
_runtime = {"webhook": None, "bot_token": None, "channel_id": None}


# ── Settings persistence (api_cache table, same as finnhub/x keys) ───────────
def _con():
    return sqlite3.connect(DB_PATH)


def _db_get(cache_id: str):
    try:
        con = _con()
        cur = con.cursor()
        cur.execute("SELECT payload, fetched_at FROM api_cache WHERE cache_key=?", (cache_id,))
        row = cur.fetchone()
        con.close()
        if row and row[0] is not None:
            return json.loads(row[0]), row[1]
    except Exception:
        pass
    return None, None


def _db_set(cache_id: str, value) -> None:
    try:
        con = _con()
        cur = con.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)",
            (cache_id, json.dumps(value), datetime.now().isoformat()),
        )
        con.commit()
        con.close()
    except Exception as e:
        print(f"[discord] could not persist {cache_id}: {e}")


def _setting(name: str) -> str:
    if _runtime[name] is None:
        val, _ = _db_get(_SETTING_IDS[name])
        _runtime[name] = (val or "").strip() if isinstance(val, str) else ""
    return _runtime[name] or os.environ.get(_ENV_NAMES[name], "").strip()


def set_setting(name: str, value: str) -> dict:
    """Save (or clear, with empty value) one Discord setting; returns status."""
    if name not in _SETTING_IDS:
        return {"error": f"unknown discord setting {name}"}
    value = (value or "").strip()
    _runtime[name] = value
    _db_set(_SETTING_IDS[name], value)
    _db_set(FEED_CACHE_ID, None)   # force re-fetch with new creds
    st = status()
    if name == "webhook" and value:
        st["webhook_valid"] = _validate_webhook(value)
    if name in ("bot_token", "channel_id") and _setting("bot_token") and _setting("channel_id"):
        msgs = _fetch_channel(limit=1, ignore_cache=True)
        st["bot_valid"] = msgs is not None
    return st


def status() -> dict:
    return {
        "webhook": bool(_setting("webhook")),
        "bot": bool(_setting("bot_token")),
        "channel": bool(_setting("channel_id")),
        "read_live": bool(_setting("bot_token") and _setting("channel_id")),
        "mode": "live" if (_setting("bot_token") and _setting("channel_id")) else "sim",
    }


# ── READ: channel feed ────────────────────────────────────────────────────────
def _fetch_channel(limit: int = 20, ignore_cache: bool = False):
    """Fetch recent messages from the configured channel. None on failure."""
    token, channel = _setting("bot_token"), _setting("channel_id")
    if not (token and channel and REQUESTS_AVAILABLE):
        return None

    if not ignore_cache:
        cached, fetched_at = _db_get(FEED_CACHE_ID)
        if cached and fetched_at:
            try:
                age = (datetime.now() - datetime.fromisoformat(fetched_at)).total_seconds()
                if age < TTL_FEED:
                    return cached
            except Exception:
                pass

    try:
        r = requests.get(
            f"{API_BASE}/channels/{channel}/messages",
            params={"limit": max(1, min(50, limit))},
            headers={"Authorization": f"Bot {token}"},
            timeout=8,
        )
        if r.status_code != 200:
            print(f"[discord] channel fetch failed: HTTP {r.status_code}")
            return None
        msgs = []
        for m in r.json():
            author = m.get("author") or {}
            content = (m.get("content") or "").strip()
            if not content and m.get("embeds"):
                content = (m["embeds"][0].get("title") or m["embeds"][0].get("description") or "").strip()
            if not content and m.get("attachments"):
                content = f"[{len(m['attachments'])} attachment(s)]"
            msgs.append({
                "id": m.get("id"),
                "author": author.get("global_name") or author.get("username") or "unknown",
                "bot": bool(author.get("bot")),
                "content": content[:400],
                "ts": m.get("timestamp"),
            })
        _db_set(FEED_CACHE_ID, msgs)
        return msgs
    except Exception as e:
        print(f"[discord] channel fetch error: {e}")
        return None


# Synthetic squawk-room chatter, seeded from the real alert stream so the
# panel reflects actual engine state even without Discord credentials.
_SIM_HANDLES = ["FlowDesk", "DeskAlpha", "VolHunter", "MacroMike", "TapeReader", "GammaGirl"]
_SIM_TEMPLATES_BULL = [
    "big prints hitting {t} — someone knows something",
    "{t} sweep on the ask, size is real",
    "accumulating {t} here, flow confirms",
    "{t} dark pool block just crossed, bullish tape",
]
_SIM_TEMPLATES_BEAR = [
    "{t} distribution all morning, careful",
    "puts rolling on {t}, desk is fading the pop",
    "{t} block sold at the bid — heads up",
    "trimming {t} into strength, flow turned",
]


def _sim_feed(limit: int) -> list[dict]:
    try:
        from engine.trading.flow_tracker import get_recent_alerts
        alerts = get_recent_alerts(24)[: max(4, limit)]
    except Exception:
        alerts = []
    rng = random.Random(datetime.now().strftime("%Y%m%d%H"))  # stable within the hour
    out = []
    now = datetime.now(timezone.utc)
    for i, a in enumerate(alerts[:limit]):
        bull = "buy" in str(a.get("direction", "")).lower() or "bull" in str(a.get("direction", "")).lower()
        tpl = rng.choice(_SIM_TEMPLATES_BULL if bull else _SIM_TEMPLATES_BEAR)
        out.append({
            "id": f"sim-{i}",
            "author": rng.choice(_SIM_HANDLES),
            "bot": False,
            "content": tpl.format(t=a.get("ticker", "SPY")),
            "ts": (now - timedelta(minutes=4 + i * 9)).isoformat(),
        })
    if not out:
        out = [{
            "id": "sim-0", "author": "JARVIS", "bot": True,
            "content": "Squawk room in SIM mode — connect a Discord bot in Settings for the live channel feed.",
            "ts": now.isoformat(),
        }]
    return out


def get_feed(limit: int = 15) -> dict:
    """Feed for the HUD panel: live channel messages, or SIM chatter."""
    msgs = _fetch_channel(limit)
    if msgs is not None:
        return {"mode": "live", "messages": msgs[:limit]}
    return {"mode": "sim", "messages": _sim_feed(limit)}


# ── WRITE: webhook relay ──────────────────────────────────────────────────────
def _validate_webhook(url: str) -> bool:
    if not REQUESTS_AVAILABLE:
        return False
    try:
        r = requests.get(url, timeout=8)
        return r.status_code == 200
    except Exception:
        return False


def send_message(content: str = "", embeds: list | None = None) -> dict:
    """Post into the configured webhook. Returns {sent: bool, ...}."""
    url = _setting("webhook")
    if not url:
        return {"sent": False, "error": "no webhook configured"}
    if not REQUESTS_AVAILABLE:
        return {"sent": False, "error": "requests not installed"}
    payload = {"username": "JARVIS", "content": content[:1900]}
    if embeds:
        payload["embeds"] = embeds[:10]
    try:
        r = requests.post(url, json=payload, timeout=8)
        ok = r.status_code in (200, 204)
        return {"sent": ok} if ok else {"sent": False, "error": f"HTTP {r.status_code}"}
    except Exception as e:
        return {"sent": False, "error": str(e)}


def _alert_embed(a: dict) -> dict:
    d = a.get("data") or {}
    bull = "buy" in str(d.get("direction", "")).lower() or "bull" in str(d.get("direction", "")).lower()
    usd = float(d.get("size_usd") or 0)
    size = f"${usd/1e9:.1f}B" if usd >= 1e9 else f"${usd/1e6:.1f}M" if usd >= 1e6 else f"${usd/1e3:.0f}K"
    return {
        "title": f"{'🟢' if bull else '🔴'} {a.get('title', 'JARVIS alert')}"[:256],
        "description": (a.get("body") or a.get("narrative") or "")[:500],
        "color": 0x1FE0A0 if bull else 0xFF5470,
        "fields": [
            {"name": "Ticker", "value": str(d.get("ticker", "—")), "inline": True},
            {"name": "Size", "value": size, "inline": True},
            {"name": "Priority", "value": str(a.get("priority", "—")), "inline": True},
        ],
        "footer": {"text": "JARVIS Command Center · Live 3D Map"},
    }


def relay_alerts(alerts: list[dict]) -> dict:
    """
    Push HIGH/CRITICAL flow alerts to the webhook, deduped across calls by
    remembering the last relayed alert signature. Safe to call every sync.
    """
    if not _setting("webhook"):
        return {"sent": 0, "reason": "no webhook"}
    flows = [
        a for a in (alerts or [])
        if a.get("type") in ("WHALE_BLOCK", "OPTIONS_SWEEP", "INSIDER_FLOW")
        and str(a.get("priority", "")).upper() in ("HIGH", "CRITICAL")
    ]
    seen, _ = _db_get(RELAY_MARK_ID)
    seen = set(seen or [])
    fresh = [a for a in flows if _sig(a) not in seen][:5]   # cap per sync
    sent = 0
    for a in fresh:
        if send_message(embeds=[_alert_embed(a)]).get("sent"):
            seen.add(_sig(a))
            sent += 1
    if fresh:
        _db_set(RELAY_MARK_ID, list(seen)[-400:])
    return {"sent": sent, "candidates": len(flows)}


def _sig(a: dict) -> str:
    d = a.get("data") or {}
    return f"{a.get('type')}|{d.get('ticker')}|{d.get('size_usd')}|{d.get('alerted_at', '')}"
