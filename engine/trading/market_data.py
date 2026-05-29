"""
Market data layer — price + EMA + volume engine.

Data source priority:
  1. Finnhub (free tier)  — real-time quotes + analyst recommendations
  2. yfinance             — historical OHLCV (if installed & reachable)
  3. Synthetic simulation — realistic fallback so the UI always works

Results are cached in SQLite to avoid redundant API calls.
"""
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

try:
    import logging
    import yfinance as yf
    # Silence yfinance's noisy network-error logging — the fallback
    # handles unreachable/offline cases gracefully.
    logging.getLogger("yfinance").setLevel(logging.CRITICAL)
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False

from engine.trading import finnhub_client as finnhub
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

    # 1. Finnhub real-time quote → today's snapshot (primary source)
    finnhub_live = finnhub.is_configured()
    if not already_fresh and finnhub_live:
        _pull_from_finnhub(ticker)

    # 2. yfinance historical backfill — only when Finnhub isn't the source
    #    (gives richer EMA history; skipped to avoid noise when a key is set)
    if not already_fresh and not finnhub_live and YF_AVAILABLE:
        _pull_from_yfinance(ticker, days)

    rows = _load_from_db(ticker, days)

    # 3. Synthetic fallback: if no real data is available (offline / no key /
    # unsupported ticker), seed a realistic series so the dashboard is always
    # populated. Real data overwrites this automatically once a feed succeeds.
    if not rows:
        _seed_synthetic(ticker, days)
        rows = _load_from_db(ticker, days)

    return rows


def _pull_from_finnhub(ticker: str) -> None:
    """Fetch a real-time quote and upsert it as today's market_data row.

    EMA is recomputed across the accumulated daily snapshots so the trend
    signal sharpens over time as JARVIS runs each day.
    """
    q = finnhub.get_quote(ticker)
    if not q:
        return
    try:
        close = float(q.get("c") or 0)
        if close <= 0:
            return
        open_ = float(q.get("o") or close)
        high = float(q.get("h") or close)
        low = float(q.get("l") or close)
        today = datetime.now().strftime("%Y-%m-%d")

        # Recompute EMA over historical closes + today's close
        con = _con()
        cur = con.cursor()
        cur.execute(
            "SELECT close FROM market_data WHERE ticker=? AND trade_date < ? "
            "ORDER BY trade_date",
            (ticker, today),
        )
        closes = [r[0] for r in cur.fetchall() if r[0]]
        closes.append(close)
        ema21 = _ema(closes, 21)[-1]

        # Volume isn't on the free /quote endpoint; keep any prior value or 0.
        cur.execute(
            """
            INSERT INTO market_data
                (ticker, trade_date, open, high, low, close, volume, ema_21, volume_ratio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker, trade_date) DO UPDATE SET
                open=excluded.open, high=excluded.high, low=excluded.low,
                close=excluded.close, ema_21=excluded.ema_21,
                fetched_at=datetime('now')
            """,
            (ticker, today, round(open_, 2), round(high, 2), round(low, 2),
             round(close, 2), 0, round(ema21, 2), 1.0),
        )
        con.commit()
        con.close()
    except Exception as e:
        print(f"[market_data] finnhub snapshot error for {ticker}: {e}")


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


# ── Synthetic fallback (smart-hybrid offline mode) ────────────────────────────

# Approximate price anchors so synthetic data looks realistic per name.
_PRICE_ANCHORS = {
    "NVDA": 135, "AMD": 165, "AVGO": 175, "INTC": 22, "ARM": 140,
    "SNPS": 480, "CDNS": 300, "ANSS": 350, "TSM": 200, "ASML": 720,
    "AMAT": 175, "AMKR": 28, "ASX": 11, "SPIL": 12, "MU": 105,
    "SMCI": 38, "DELL": 130, "HPE": 21, "VRT": 115, "ETN": 320,
    "MOD": 110, "ANET": 400, "CSCO": 58, "MRVL": 88, "CRDO": 65,
    "CIEN": 78, "NOK": 4.5, "CEG": 280, "NEE": 72, "GEV": 480,
    "VST": 165, "EMR": 120, "NVT": 72, "LIN": 460, "FCX": 42,
    "IONQ": 38, "RGTI": 14, "QBTS": 18, "ASTS": 32, "RDW": 18,
    "^VIX": 16, "SPY": 595,
}


def _seed_synthetic(ticker: str, days: int) -> None:
    """Generate a deterministic-but-varied OHLCV series and cache it."""
    import random
    base = _PRICE_ANCHORS.get(ticker, 50)
    # Seed per ticker+date so values are stable within a day but differ daily
    seed = hash(ticker) ^ hash(datetime.now().strftime("%Y-%m-%d"))
    rng = random.Random(seed)

    n = days + 30
    drift = rng.uniform(-0.0025, 0.0040)        # gentle per-day trend
    vol = abs(base) * rng.uniform(0.012, 0.030)  # daily volatility

    price = base * rng.uniform(0.90, 1.0)
    closes, ohlc, volumes = [], [], []
    for _ in range(n):
        price = max(0.5, price * (1 + drift) + rng.gauss(0, vol / base))
        o = price * (1 + rng.uniform(-0.01, 0.01))
        h = max(o, price) * (1 + rng.uniform(0, 0.012))
        lo = min(o, price) * (1 - rng.uniform(0, 0.012))
        closes.append(price)
        ohlc.append((o, h, lo, price))
        base_vol = rng.randint(2_000_000, 40_000_000)
        # Occasional volume spike to feed whale/sweep detectors
        spike = rng.random() < 0.08
        volumes.append(int(base_vol * (rng.uniform(3, 6) if spike else 1)))

    ema21 = _ema(closes, 21)
    avg_vol = []
    for i in range(len(volumes)):
        w = volumes[max(0, i - 19): i + 1]
        avg_vol.append(sum(w) / len(w) if w else 1)

    end = datetime.now()
    con = _con()
    cur = con.cursor()
    for i in range(n):
        date = (end - timedelta(days=n - 1 - i)).strftime("%Y-%m-%d")
        o, h, lo, c = ohlc[i]
        vol_ratio = (volumes[i] / avg_vol[i]) if avg_vol[i] > 0 else 1.0
        cur.execute(
            """
            INSERT INTO market_data
                (ticker, trade_date, open, high, low, close, volume, ema_21, volume_ratio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker, trade_date) DO NOTHING
            """,
            (ticker, date, round(o, 2), round(h, 2), round(lo, 2),
             round(c, 2), volumes[i], round(ema21[i], 2), round(vol_ratio, 2)),
        )
    con.commit()
    con.close()


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

    When live data is active, this blends the price-vs-EMA trend with the
    Finnhub analyst recommendation trend so the signal is meaningful even
    before a long EMA history has accumulated.
    """
    rows = fetch_ticker_data(ticker, days=30)
    ema_bias = 0.0
    if rows:
        latest = rows[-1]
        close = latest.get("close") or 0
        ema = latest.get("ema_21") or close
        if ema:
            pct = (close - ema) / ema           # fraction above/below EMA
            ema_bias = max(-1.0, min(1.0, pct / 0.05))  # ±5% = extreme

    # Blend in analyst recommendations when the live feed is configured.
    if finnhub.is_configured():
        ab = finnhub.analyst_bias(ticker)
        if ab is not None:
            # Thin EMA history (few snapshots) → lean on analyst signal more.
            history_depth = len(rows)
            w_ema = min(history_depth / 21.0, 1.0) * 0.6
            w_analyst = 1.0 - w_ema
            return max(-1.0, min(1.0, ema_bias * w_ema + ab * w_analyst))

    return ema_bias


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
