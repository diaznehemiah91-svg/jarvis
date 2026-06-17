"""
Institutional Flow Tracker — detects whale block trades and options sweeps.

Whale Blocks (Dark Pools):
  Large off-exchange accumulation identified by volume anomalies combined
  with minimal price movement (a telltale dark pool signature).

Options Sweeps:
  Aggressive multi-leg sweeps on out-of-the-money calls/puts detected via
  unusually high put/call ratios or open interest spikes.

Real API hooks:
  - Unusual Whales (paid) → set UNUSUAL_WHALES_KEY in config
  - Tradier options API (free tier) → set TRADIER_TOKEN in config
  - Falls back to statistical anomaly detection on yfinance volume data.
"""
import json
import random
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from engine.trading.market_data import fetch_ticker_data
from engine.trading.tickers import SECTOR_MAP, get_all_tickers, get_sector_for_ticker

DB_PATH = "jarvis.db"

# Thresholds
WHALE_VOLUME_RATIO = 3.0        # 3× average = unusual volume
WHALE_PRICE_CHANGE_MAX = 0.01   # price barely moved (dark pool signature)
SWEEP_VOLUME_RATIO = 4.0        # options sweep needs 4× normal volume
MIN_NOTIONAL_USD = 1_000_000    # minimum $1M to flag as institutional


def _con():
    return sqlite3.connect(DB_PATH)


# ── Persistence ───────────────────────────────────────────────────────────────

def _save_alert(ticker: str, alert_type: str, direction: str,
                size_usd: float, details: dict, sector_key: Optional[str] = None) -> int:
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        INSERT INTO flow_alerts
            (ticker, alert_type, direction, size_usd, details, sector_key)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (ticker, alert_type, direction, size_usd,
         json.dumps(details), sector_key or get_sector_for_ticker(ticker)),
    )
    aid = cur.lastrowid
    con.commit()
    con.close()
    return aid


# ── Whale block detection ─────────────────────────────────────────────────────

def detect_whale_blocks(tickers: Optional[list[str]] = None) -> list[dict]:
    """
    Scan tickers for dark-pool accumulation signatures:
    - Volume ratio ≥ WHALE_VOLUME_RATIO (unusual volume)
    - Intraday price range < WHALE_PRICE_CHANGE_MAX (suppressed volatility)
    Returns list of alert dicts.
    """
    tickers = tickers or get_all_tickers()
    alerts = []

    for ticker in tickers:
        rows = fetch_ticker_data(ticker, days=7)
        if not rows or len(rows) < 2:
            continue
        # Scan the recent window for the highest-volume session — institutional
        # accumulation often spans several days, so we surface the standout day.
        recent = rows[-5:]
        latest = max(recent, key=lambda r: (r.get("volume_ratio") or 0))

        vol_ratio = latest.get("volume_ratio", 1.0) or 1.0
        close = latest.get("close") or 0
        open_ = latest.get("open") or close
        high = latest.get("high") or close
        low = latest.get("low") or close

        if close == 0:
            continue

        intraday_range = (high - low) / close if close > 0 else 1.0
        price_change = abs(close - open_) / open_ if open_ > 0 else 1.0

        # Signature: large volume + price barely moved
        if vol_ratio >= WHALE_VOLUME_RATIO and price_change <= WHALE_PRICE_CHANGE_MAX:
            volume = latest.get("volume", 0) or 0
            notional = volume * close
            if notional < MIN_NOTIONAL_USD:
                continue

            direction = "bullish" if close >= open_ else "bearish"
            details = {
                "trade_date": latest.get("trade_date"),
                "close": close,
                "volume": volume,
                "volume_ratio": round(vol_ratio, 2),
                "price_change_pct": round(price_change * 100, 3),
                "intraday_range_pct": round(intraday_range * 100, 3),
            }
            aid = _save_alert(ticker, "whale_block", direction, notional, details)
            alerts.append({
                "id": aid,
                "ticker": ticker,
                "alert_type": "Whale Block (Dark Pool)",
                "direction": direction,
                "notional_usd": f"${notional:,.0f}",
                "sector": get_sector_for_ticker(ticker),
                **details,
            })

    return alerts


# ── Options sweep detection ───────────────────────────────────────────────────

def detect_options_sweeps(
    tickers: Optional[list[str]] = None,
    tradier_token: str = "",
    unusual_whales_key: str = "",
) -> list[dict]:
    """
    Detect large OTM call/put sweeps. Uses Unusual Whales or Tradier if keys
    are configured, otherwise falls back to volume-based proxy detection.
    """
    tickers = tickers or get_all_tickers()

    if unusual_whales_key and REQUESTS_AVAILABLE:
        return _sweeps_from_unusual_whales(tickers, unusual_whales_key)
    elif tradier_token and REQUESTS_AVAILABLE:
        return _sweeps_from_tradier(tickers, tradier_token)
    else:
        return _sweeps_volume_proxy(tickers)


def _sweeps_from_unusual_whales(tickers: list[str], api_key: str) -> list[dict]:
    alerts = []
    try:
        resp = requests.get(
            "https://api.unusualwhales.com/api/option-trades/flow-alerts",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15,
        )
        data = resp.json().get("data", [])
        for item in data:
            ticker = item.get("ticker_symbol", "").upper()
            if ticker not in tickers:
                continue
            notional = float(item.get("premium", 0))
            if notional < MIN_NOTIONAL_USD:
                continue
            direction = "bullish" if item.get("put_call") == "CALL" else "bearish"
            details = {
                "strike": item.get("strike"),
                "expiry": item.get("expiry"),
                "option_type": item.get("put_call"),
                "volume": item.get("volume"),
                "open_interest": item.get("open_interest"),
                "implied_volatility": item.get("implied_volatility"),
            }
            aid = _save_alert(ticker, "options_sweep", direction, notional, details)
            alerts.append({
                "id": aid, "ticker": ticker,
                "alert_type": "Options Sweep",
                "direction": direction,
                "notional_usd": f"${notional:,.0f}",
                "sector": get_sector_for_ticker(ticker),
                **details,
            })
    except Exception as e:
        print(f"[flow] Unusual Whales error: {e}")
    return alerts


def _sweeps_from_tradier(tickers: list[str], token: str) -> list[dict]:
    """Use Tradier options chain to detect volume/OI spikes."""
    alerts = []
    for ticker in tickers[:20]:  # rate limit consideration
        try:
            resp = requests.get(
                f"https://api.tradier.com/v1/markets/options/chains",
                params={"symbol": ticker, "expiration": _next_expiry(),
                        "greeks": "false"},
                headers={"Authorization": f"Bearer {token}",
                         "Accept": "application/json"},
                timeout=10,
            )
            chain = resp.json().get("options", {}).get("option", [])
            if not chain:
                continue
            for opt in chain:
                volume = opt.get("volume", 0) or 0
                oi = opt.get("open_interest", 1) or 1
                if volume / oi < SWEEP_VOLUME_RATIO:
                    continue
                notional = volume * (opt.get("ask", 0) or 0) * 100
                if notional < MIN_NOTIONAL_USD:
                    continue
                direction = "bullish" if opt.get("option_type") == "call" else "bearish"
                details = {
                    "strike": opt.get("strike"),
                    "expiry": opt.get("expiration_date"),
                    "option_type": opt.get("option_type"),
                    "volume": volume, "open_interest": oi,
                }
                aid = _save_alert(ticker, "options_sweep", direction, notional, details)
                alerts.append({
                    "id": aid, "ticker": ticker,
                    "alert_type": "Options Sweep",
                    "direction": direction,
                    "notional_usd": f"${notional:,.0f}",
                    "sector": get_sector_for_ticker(ticker),
                    **details,
                })
        except Exception as e:
            print(f"[flow] Tradier error for {ticker}: {e}")
    return alerts


def _sweeps_volume_proxy(tickers: list[str]) -> list[dict]:
    """
    Statistical proxy: extreme volume ratio on high-beta names
    used as a synthetic sweep signal when no options API is configured.
    """
    alerts = []
    for ticker in tickers:
        rows = fetch_ticker_data(ticker, days=7)
        if not rows:
            continue
        # Surface the standout-volume session in the recent window
        latest = max(rows[-5:], key=lambda r: (r.get("volume_ratio") or 0))
        vol_ratio = latest.get("volume_ratio", 1.0) or 1.0
        close = latest.get("close") or 0
        volume = latest.get("volume", 0) or 0
        open_ = latest.get("open") or close

        if vol_ratio < SWEEP_VOLUME_RATIO or close == 0:
            continue

        notional = volume * close * 0.05  # synthetic options premium proxy
        if notional < MIN_NOTIONAL_USD:
            continue

        direction = "bullish" if close > open_ else "bearish"
        details = {
            "trade_date": latest.get("trade_date"),
            "close": close,
            "volume_ratio": round(vol_ratio, 2),
            "note": "Volume-proxy sweep signal (no options API configured)",
        }
        aid = _save_alert(ticker, "options_sweep", direction, notional, details)
        alerts.append({
            "id": aid, "ticker": ticker,
            "alert_type": "Options Sweep (proxy)",
            "direction": direction,
            "notional_usd": f"${notional:,.0f}",
            "sector": get_sector_for_ticker(ticker),
            **details,
        })

    return alerts


def _next_expiry() -> str:
    """Return the nearest Friday (weekly expiry) from today."""
    today = datetime.now()
    days_ahead = (4 - today.weekday()) % 7  # 4 = Friday
    if days_ahead == 0:
        days_ahead = 7
    return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


# ── Alert history ─────────────────────────────────────────────────────────────

def get_recent_alerts(hours: int = 24, alert_type: Optional[str] = None) -> list[dict]:
    cutoff = (datetime.now() - timedelta(hours=hours)).isoformat()
    con = _con()
    cur = con.cursor()
    if alert_type:
        cur.execute(
            """
            SELECT id, ticker, alert_type, direction, size_usd, details, sector_key, alerted_at
            FROM flow_alerts
            WHERE alerted_at >= ? AND alert_type = ?
            ORDER BY size_usd DESC
            """,
            (cutoff, alert_type),
        )
    else:
        cur.execute(
            """
            SELECT id, ticker, alert_type, direction, size_usd, details, sector_key, alerted_at
            FROM flow_alerts
            WHERE alerted_at >= ?
            ORDER BY size_usd DESC
            """,
            (cutoff,),
        )
    rows = cur.fetchall()
    con.close()
    return [
        {
            "id": r[0], "ticker": r[1], "alert_type": r[2],
            "direction": r[3], "size_usd": r[4],
            "details": json.loads(r[5]) if r[5] else {},
            "sector_key": r[6], "alerted_at": r[7],
        }
        for r in rows
    ]


def detect_insider_flow(tickers: Optional[list[str]] = None) -> list[dict]:
    """
    Real insider buys/sells from Finnhub (free tier) — genuine smart-money
    signal. Net positive insider buying prints a bullish institutional alert.
    No-op when Finnhub isn't configured.
    """
    from engine.trading import finnhub_client as finnhub
    if not finnhub.is_configured():
        return []

    tickers = tickers or get_all_tickers()
    alerts = []
    for ticker in tickers:
        flow = finnhub.insider_flow(ticker)
        if not flow:
            continue
        notional = max(flow["buy_value"], flow["sell_value"])
        if notional < MIN_NOTIONAL_USD / 4:  # insider sizes run smaller
            continue
        details = {
            "net_shares": flow["net_shares"],
            "buy_value": round(flow["buy_value"], 0),
            "sell_value": round(flow["sell_value"], 0),
            "transactions": flow["txns"],
            "note": "Real insider transactions (Finnhub)",
        }
        aid = _save_alert(ticker, "insider_flow", flow["direction"], notional, details)
        alerts.append({
            "id": aid, "ticker": ticker,
            "alert_type": "Insider Flow",
            "direction": flow["direction"],
            "notional_usd": f"${notional:,.0f}",
            "sector": get_sector_for_ticker(ticker),
            **details,
        })
    return alerts


def run_full_scan(
    tradier_token: str = "",
    unusual_whales_key: str = "",
) -> dict:
    """Run whale block + options sweep + insider scan across all tickers."""
    whale_alerts = detect_whale_blocks()
    sweep_alerts = detect_options_sweeps(
        tradier_token=tradier_token,
        unusual_whales_key=unusual_whales_key,
    )
    insider_alerts = detect_insider_flow()
    return {
        "whale_blocks": whale_alerts,
        "options_sweeps": sweep_alerts,
        "insider_flow": insider_alerts,
        "total_alerts": len(whale_alerts) + len(sweep_alerts) + len(insider_alerts),
        "scanned_at": datetime.now().isoformat(),
    }


# ── Ripple mapping ────────────────────────────────────────────────────────────

def map_flow_ripple(ticker: str) -> dict:
    """
    Given a ticker with detected institutional flow, trace the supply-chain
    ripple effect — which other sectors would benefit?
    """
    sector_key = get_sector_for_ticker(ticker)
    if not sector_key:
        return {"ticker": ticker, "ripple": []}

    ripple_map = {
        "energy_utilities": ["power_thermal", "industrial_materials"],
        "power_thermal": ["server_oems", "energy_utilities"],
        "compute_silicon": ["advanced_packaging", "hbm_memory", "mfg_equipment"],
        "advanced_packaging": ["compute_silicon", "hbm_memory"],
        "hbm_memory": ["compute_silicon", "server_oems"],
        "server_oems": ["networking_optics", "power_thermal"],
        "networking_optics": ["server_oems", "compute_silicon"],
        "mfg_equipment": ["compute_silicon", "industrial_materials"],
        "quantum": ["compute_silicon", "eda_chip_design"],
        "space_satellite": ["networking_optics", "energy_utilities"],
        "eda_chip_design": ["compute_silicon", "mfg_equipment"],
        "industrial_materials": ["mfg_equipment", "energy_utilities"],
    }

    downstream = ripple_map.get(sector_key, [])
    ripple = []
    for sk in downstream:
        info = SECTOR_MAP.get(sk, {})
        ripple.append({
            "sector_key": sk,
            "sector_name": info.get("name", sk),
            "tickers": info.get("tickers", []),
            "rationale": f"Flow into {SECTOR_MAP.get(sector_key, {}).get('name', sector_key)} "
                         f"historically drives demand in {info.get('name', sk)}",
        })

    return {
        "trigger_ticker": ticker,
        "trigger_sector": sector_key,
        "trigger_sector_name": SECTOR_MAP.get(sector_key, {}).get("name", sector_key),
        "ripple_effects": ripple,
    }
