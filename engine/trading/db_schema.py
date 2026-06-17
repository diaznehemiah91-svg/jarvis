"""
Initialize all trading-related SQLite tables inside jarvis.db.
Safe to call repeatedly — uses CREATE TABLE IF NOT EXISTS.
"""
import sqlite3


def init_trading_db(db_path: str = "jarvis.db") -> None:
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # Ticker registry with sector metadata
    cur.execute("""
        CREATE TABLE IF NOT EXISTS trading_tickers (
            ticker      TEXT PRIMARY KEY,
            sector_key  TEXT NOT NULL,
            sector_name TEXT NOT NULL,
            layer       TEXT NOT NULL,
            added_at    TEXT DEFAULT (datetime('now'))
        )
    """)

    # Daily OHLCV + EMA cache  (one row per ticker per date)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS market_data (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker      TEXT NOT NULL,
            trade_date  TEXT NOT NULL,
            open        REAL,
            high        REAL,
            low         REAL,
            close       REAL,
            volume      INTEGER,
            ema_21      REAL,
            volume_ratio REAL,
            fetched_at  TEXT DEFAULT (datetime('now')),
            UNIQUE (ticker, trade_date)
        )
    """)

    # Sentiment scores (one row per source per ticker/sector per day)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sentiment_scores (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            target      TEXT NOT NULL,   -- ticker or sector key
            target_type TEXT NOT NULL,   -- 'ticker' | 'sector'
            source      TEXT NOT NULL,   -- 'reddit' | 'news' | 'aggregate'
            score       REAL NOT NULL,   -- -1.0 to +1.0
            mention_count INTEGER DEFAULT 0,
            acceleration  REAL DEFAULT 0.0,  -- % change vs prior window
            scored_at   TEXT DEFAULT (datetime('now'))
        )
    """)

    # Regime snapshots
    cur.execute("""
        CREATE TABLE IF NOT EXISTS regime_snapshots (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            regime          TEXT NOT NULL,  -- 'risk_on' | 'defensive' | 'risk_off'
            regime_score    REAL NOT NULL,
            tech_bias       REAL,
            news_sentiment  REAL,
            reddit_momentum REAL,
            vix_level       REAL,
            snapshot_at     TEXT DEFAULT (datetime('now'))
        )
    """)

    # Institutional flow alerts
    cur.execute("""
        CREATE TABLE IF NOT EXISTS flow_alerts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker      TEXT NOT NULL,
            alert_type  TEXT NOT NULL,  -- 'whale_block' | 'options_sweep'
            direction   TEXT NOT NULL,  -- 'bullish' | 'bearish'
            size_usd    REAL,           -- estimated notional in USD
            details     TEXT,           -- JSON details string
            sector_key  TEXT,
            alerted_at  TEXT DEFAULT (datetime('now')),
            acknowledged INTEGER DEFAULT 0
        )
    """)

    # Reddit/news mention acceleration log
    cur.execute("""
        CREATE TABLE IF NOT EXISTS mention_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker      TEXT NOT NULL,
            window_start TEXT NOT NULL,
            window_end   TEXT NOT NULL,
            mention_count INTEGER DEFAULT 0,
            prev_count  INTEGER DEFAULT 0,
            pct_change  REAL DEFAULT 0.0,
            source      TEXT NOT NULL,
            logged_at   TEXT DEFAULT (datetime('now'))
        )
    """)

    # Generic API response cache (Finnhub etc.) with TTL via fetched_at
    cur.execute("""
        CREATE TABLE IF NOT EXISTS api_cache (
            cache_key  TEXT PRIMARY KEY,
            payload    TEXT NOT NULL,
            fetched_at TEXT DEFAULT (datetime('now'))
        )
    """)

    con.commit()
    con.close()
