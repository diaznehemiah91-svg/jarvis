"""
Market data layer — fetches OHLCV via yfinance, computes EMAs and volume
ratios, and caches results in SQLite to avoid redundant API calls.
"""
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

try:
    import yfinance as yf
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False

from engine.trading.tickers import get_all_tickers, SECTOR_MAP, get_sector_for_ticker

DB_PATH = "jarvis.db"


def _con() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


# ── EMA helper ────────────────────────────────────────────────────────────────

def _ema(values: list[float], period: int) -> list[float]:
    if not values:
        return []
    k = 2 / (period + 1)
    emas = [values[0]]
    for v in values[1:]:
        emas.append(v * k + emas[-1] * (1 - k))
    return emas


# ── Fetch & cache ─────────────────────────────────────────────────────────────

def fetch_ticker_data(ticker: str, days: int = 30) -> list[dict]:
    """Return cached OHLCV rows for ticker, refreshing from yfinance if stale."""
    today = datetime.now().strftime("%Y-%m-%d")
    con = _con()
    cur = con.cursor()

    cur.execute(
        "SELECT * FROM market_data WHERE ticker=? AND trade_date=? LIMIT 1",
        (ticker, today),
    )
    already_fresh = cur.fetchone() is not None
    con.close()

    if not already_fresh and YF_AVAILABLE:
        _pull_from_yfinance(ticker, days)

    return _load_from_db(ticker, days)


def _pull_from_yfinance(ticker: str, days: int) -> None:
    try:
        end = datetime.now()
        start = end - timedelta(days=days + 30)  # extra for EMA warmup
        t = yf.Ticker(ticker)
        hist = t.history(start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"))
        if hist.empty:
            return

        closes = hist["Close"].tolist()
        volumes = hist["Volume"].tolist()
        dates = [d.strftime("%Y-%m-%d") for d in hist.index]

        ema21 = _ema(closes, 21)
        avg_vol_20 = []
        for i in range(len(volumes)):
            window = volumes[max(0, i - 19): i + 1]
            avg_vol_20.append(sum(window) / len(window) if window else 0)

        con = _con()
        cur = con.cursor()
        for i, date in enumerate(dates):
            vol_ratio = (volumes[i] / avg_vol_20[i]) if avg_vol_20[i] > 0 else 1.0
            cur.execute(
                """
                INSERT INTO market_data
                    (ticker, trade_date, open, high, low, close, volume, ema_21, volume_ratio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ticker, trade_date) DO UPDATE SET
                    close=excluded.close, volume=excluded.volume,
                    ema_21=excluded.ema_21, volume_ratio=excluded.volume_ratio,
                    fetched_at=datetime('now')
                """,
                (
                    ticker,
                    date,
                    float(hist["Open"].iloc[i]),
                    float(hist["High"].iloc[i]),
                    float(hist["Low"].iloc[i]),
                    float(closes[i]),
                    int(volumes[i]),
                    float(ema21[i]),
                    float(vol_ratio),
                ),
            )
        con.commit()
        con.close()
    except Exception as e:
        print(f"[market_data] yfinance error for {ticker}: {e}")


def _load_from_db(ticker: str, days: int) -> list[dict]:
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        SELECT ticker, trade_date, open, high, low, close, volume, ema_21, volume_ratio
        FROM market_data
        WHERE ticker=? AND trade_date >= ?
        ORDER BY trade_date
        """,
        (ticker, cutoff),
    )
    rows = cur.fetchall()
    con.close()
    cols = ["ticker", "trade_date", "open", "high", "low", "close", "volume", "ema_21", "volume_ratio"]
    return [dict(zip(cols, r)) for r in rows]


# ── Technical bias ────────────────────────────────────────────────────────────

def get_technical_bias(ticker: str) -> float:
    """
    Return a bias score in [-1, +1].
      +1  = price well above 21-EMA (strong uptrend)
       0  = at the EMA
      -1  = price well below 21-EMA (downtrend)
    """
    rows = fetch_ticker_data(ticker, days=5)
    if not rows:
        return 0.0
    latest = rows[-1]
    close = latest.get("close") or 0
    ema = latest.get("ema_21") or close
    if ema == 0:
        return 0.0
    pct = (close - ema) / ema  # fraction above/below EMA
    # Clamp to [-1, +1] treating ±5% as extreme
    return max(-1.0, min(1.0, pct / 0.05))


def get_sector_technical_bias(sector_key: str) -> float:
    """Average technical bias across all tickers in a sector."""
    tickers = SECTOR_MAP.get(sector_key, {}).get("tickers", [])
    if not tickers:
        return 0.0
    scores = [get_technical_bias(t) for t in tickers]
    return sum(scores) / len(scores)


def get_vix_level() -> float:
    """Fetch latest VIX close. Returns 18.0 as neutral fallback."""
    if not YF_AVAILABLE:
        return 18.0
    try:
        rows = fetch_ticker_data("^VIX", days=3)
        if rows:
            return rows[-1].get("close", 18.0)
    except Exception:
        pass
    return 18.0


# ── Sector snapshot ───────────────────────────────────────────────────────────

def get_sector_snapshot(sector_key: str) -> dict:
    """Return latest price/volume data for all tickers in a sector."""
    info = SECTOR_MAP.get(sector_key, {})
    tickers = info.get("tickers", [])
    results = []
    for t in tickers:
        rows = fetch_ticker_data(t, days=5)
        if rows:
            latest = rows[-1]
            results.append({
                "ticker": t,
                "close": latest.get("close"),
                "ema_21": latest.get("ema_21"),
                "volume": latest.get("volume"),
                "volume_ratio": latest.get("volume_ratio"),
                "bias": get_technical_bias(t),
            })
    return {
        "sector_key": sector_key,
        "sector_name": info.get("name", sector_key),
        "layer": info.get("layer", ""),
        "tickers": results,
    }


def refresh_all_tickers(days: int = 30) -> dict:
    """Bulk-refresh market data for all tracked tickers. Returns summary."""
    tickers = get_all_tickers() + ["^VIX", "SPY"]
    ok, failed = [], []
    for t in tickers:
        try:
            fetch_ticker_data(t, days)
            ok.append(t)
        except Exception as e:
            failed.append(t)
            print(f"[refresh] {t} failed: {e}")
    return {"refreshed": ok, "failed": failed}
