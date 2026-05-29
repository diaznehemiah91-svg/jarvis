"""
Sentiment engine — ingests Reddit and news headlines, scores them with VADER
(and optionally FinBERT), tracks mention acceleration, and persists results.

Pipeline:
  [Reddit PRAW / mock] → VADER/FinBERT → score → SQLite
  [News RSS / Alpha Vantage] → VADER/FinBERT → score → SQLite
"""
import json
import re
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Optional

# VADER sentiment (lightweight, no GPU)
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False

# Reddit via PRAW (optional)
try:
    import praw
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False

# Requests for news
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from engine.trading.tickers import get_all_tickers, SECTOR_MAP

DB_PATH = "jarvis.db"

SUBREDDITS = [
    "wallstreetbets", "stocks", "options", "investing",
    "hardware", "QuantumComputing", "AIInvesting",
]

ACCELERATION_THRESHOLD = 2.0  # 200% spike triggers alert flag


# ── DB helpers ────────────────────────────────────────────────────────────────

def _con():
    return sqlite3.connect(DB_PATH)


def _save_score(target: str, target_type: str, source: str,
                score: float, mention_count: int, acceleration: float) -> None:
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        INSERT INTO sentiment_scores
            (target, target_type, source, score, mention_count, acceleration)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (target, target_type, source, score, mention_count, acceleration),
    )
    con.commit()
    con.close()


def _log_mention(ticker: str, source: str, count: int,
                 window_start: str, window_end: str) -> float:
    """Log mention counts and compute % acceleration vs prior window."""
    con = _con()
    cur = con.cursor()
    prior_start = (
        datetime.fromisoformat(window_start) - timedelta(hours=3)
    ).isoformat()
    cur.execute(
        """
        SELECT mention_count FROM mention_log
        WHERE ticker=? AND source=? AND window_start >= ? AND window_start < ?
        ORDER BY logged_at DESC LIMIT 1
        """,
        (ticker, source, prior_start, window_start),
    )
    row = cur.fetchone()
    prev = row[0] if row else 0
    pct = ((count - prev) / max(prev, 1)) * 100.0

    cur.execute(
        """
        INSERT INTO mention_log
            (ticker, window_start, window_end, mention_count, prev_count, pct_change, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (ticker, window_start, window_end, count, prev, pct, source),
    )
    con.commit()
    con.close()
    return pct


# ── Scoring primitives ────────────────────────────────────────────────────────

def _vader_score(text: str) -> float:
    """Return compound VADER score in [-1, +1]."""
    if not VADER_AVAILABLE or not text:
        return 0.0
    analyzer = SentimentIntensityAnalyzer()
    return analyzer.polarity_scores(text)["compound"]


def _score_texts(texts: list[str]) -> float:
    """Average compound score for a list of text snippets."""
    if not texts:
        return 0.0
    scores = [_vader_score(t) for t in texts]
    return sum(scores) / len(scores)


def _extract_tickers(text: str, watchlist: list[str]) -> list[str]:
    """Find any watchlist tickers mentioned in text."""
    text_upper = text.upper()
    return [t for t in watchlist if re.search(r'\b' + t + r'\b', text_upper)]


# ── Reddit ingestion ──────────────────────────────────────────────────────────

def score_reddit(
    reddit_client_id: str = "",
    reddit_secret: str = "",
    reddit_user_agent: str = "jarvis-flow-tracker/1.0",
    post_limit: int = 100,
) -> dict:
    """
    Scrape recent posts from SUBREDDITS, score sentiment per ticker,
    detect acceleration, persist to DB. Returns per-ticker results.
    """
    watchlist = get_all_tickers()
    now = datetime.now()
    window_end = now.isoformat()
    window_start = (now - timedelta(hours=3)).isoformat()

    # --- real PRAW path ---
    posts: list[str] = []
    if PRAW_AVAILABLE and reddit_client_id and reddit_secret:
        try:
            reddit = praw.Reddit(
                client_id=reddit_client_id,
                client_secret=reddit_secret,
                user_agent=reddit_user_agent,
            )
            for sub in SUBREDDITS:
                for post in reddit.subreddit(sub).hot(limit=post_limit):
                    posts.append(f"{post.title} {post.selftext[:200]}")
        except Exception as e:
            print(f"[reddit] PRAW error: {e}")

    # --- mock path: generate synthetic mention data for demo ---
    if not posts:
        posts = _mock_reddit_posts(watchlist)

    ticker_texts: dict[str, list[str]] = {t: [] for t in watchlist}
    for post in posts:
        for ticker in _extract_tickers(post, watchlist):
            ticker_texts[ticker].append(post)

    results = {}
    for ticker, texts in ticker_texts.items():
        if not texts:
            continue
        score = _score_texts(texts)
        count = len(texts)
        accel = _log_mention(ticker, "reddit", count, window_start, window_end)
        _save_score(ticker, "ticker", "reddit", score, count, accel)
        results[ticker] = {
            "score": round(score, 4),
            "mention_count": count,
            "acceleration_pct": round(accel, 1),
            "flagged": accel >= ACCELERATION_THRESHOLD * 100,
        }

    return results


def _mock_reddit_posts(watchlist: list[str]) -> list[str]:
    """Generate realistic-looking post text for offline/demo use."""
    import random
    templates = [
        "{t} is going to absolutely rip this week. Load up on calls.",
        "What's everyone's thoughts on {t}? Seeing unusual volume.",
        "{t} DD: institutional buyers have been quietly accumulating.",
        "Sold my {t} position today. The risk/reward doesn't make sense here.",
        "Bullish on {t} — liquid cooling demand is only going to increase.",
        "{t} just broke above its 21-day EMA on 3x average volume.",
        "Anyone watching {t}? Feels like a catalyst is coming.",
        "Bears wrong again on {t}. This thing wants to go higher.",
        "{t} earnings crush expectations. AI demand continues.",
        "Why {t} is the pick-and-shovel play nobody is talking about.",
    ]
    posts = []
    for t in random.sample(watchlist, min(len(watchlist), 20)):
        for _ in range(random.randint(1, 8)):
            posts.append(random.choice(templates).format(t=t))
    return posts


# ── News ingestion ────────────────────────────────────────────────────────────

NEWS_SOURCES = [
    # Alpha Vantage news (free tier, key required)
    # Benzinga / RSS endpoints can be swapped in here
]


def score_news(alpha_vantage_key: str = "") -> dict:
    """
    Fetch news headlines for each ticker, score via VADER.

    Source priority:
      1. Finnhub /company-news (free tier) — real headlines
      2. Alpha Vantage news (if key provided)
      3. Mock headlines (offline fallback)
    """
    watchlist = get_all_tickers()
    results = {}

    from engine.trading import finnhub_client as finnhub
    if finnhub.is_configured():
        results = _score_finnhub_news(watchlist, finnhub)
    elif alpha_vantage_key and REQUESTS_AVAILABLE:
        results = _score_alpha_vantage_news(watchlist, alpha_vantage_key)
    else:
        results = _mock_news_scores(watchlist)

    # Persist
    for ticker, data in results.items():
        _save_score(
            ticker, "ticker", "news",
            data["score"], data.get("article_count", 0), 0.0,
        )

    return results


def _score_finnhub_news(watchlist: list[str], finnhub) -> dict:
    """Score real company-news headlines from Finnhub via VADER."""
    results = {}
    for ticker in watchlist:
        articles = finnhub.get_company_news(ticker, days=7)
        if not articles:
            # Keep a neutral entry so the ticker still appears
            results[ticker] = {"score": 0.0, "article_count": 0}
            continue
        headlines = [
            (a.get("headline", "") + " " + a.get("summary", ""))
            for a in articles[:25]
        ]
        score = _score_texts(headlines)
        results[ticker] = {"score": round(score, 4), "article_count": len(headlines)}
    return results


def _score_alpha_vantage_news(watchlist: list[str], api_key: str) -> dict:
    results = {}
    base = "https://www.alphavantage.co/query"
    for ticker in watchlist:
        try:
            resp = requests.get(base, params={
                "function": "NEWS_SENTIMENT",
                "tickers": ticker,
                "apikey": api_key,
                "limit": 20,
            }, timeout=10)
            data = resp.json()
            feed = data.get("feed", [])
            headlines = [item.get("title", "") + " " + item.get("summary", "")
                         for item in feed]
            score = _score_texts(headlines)
            results[ticker] = {"score": round(score, 4), "article_count": len(headlines)}
            time.sleep(0.5)  # respect rate limits
        except Exception as e:
            print(f"[news] Alpha Vantage error for {ticker}: {e}")
    return results


def _mock_news_scores(watchlist: list[str]) -> dict:
    import random
    results = {}
    for t in watchlist:
        score = random.uniform(-0.4, 0.7)
        results[t] = {"score": round(score, 4), "article_count": random.randint(2, 15)}
    return results


# ── Aggregate sentiment ───────────────────────────────────────────────────────

def get_aggregate_sentiment(ticker: str, lookback_hours: int = 24) -> dict:
    """Load latest reddit + news scores for a ticker and combine them."""
    cutoff = (datetime.now() - timedelta(hours=lookback_hours)).isoformat()
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        SELECT source, score, mention_count, acceleration, scored_at
        FROM sentiment_scores
        WHERE target=? AND scored_at >= ?
        ORDER BY scored_at DESC
        """,
        (ticker, cutoff),
    )
    rows = cur.fetchall()
    con.close()

    reddit_scores, news_scores = [], []
    for source, score, _, _, _ in rows:
        if source == "reddit":
            reddit_scores.append(score)
        elif source == "news":
            news_scores.append(score)

    reddit_avg = (sum(reddit_scores) / len(reddit_scores)) if reddit_scores else 0.0
    news_avg = (sum(news_scores) / len(news_scores)) if news_scores else 0.0

    # Weighted: news 60%, reddit 40%
    combined = reddit_avg * 0.4 + news_avg * 0.6
    return {
        "ticker": ticker,
        "reddit_score": round(reddit_avg, 4),
        "news_score": round(news_avg, 4),
        "combined_score": round(combined, 4),
        "label": _label(combined),
    }


def get_sector_sentiment(sector_key: str) -> dict:
    """Average aggregate sentiment across a sector's tickers."""
    tickers = SECTOR_MAP.get(sector_key, {}).get("tickers", [])
    if not tickers:
        return {"sector_key": sector_key, "combined_score": 0.0}

    scores = [get_aggregate_sentiment(t)["combined_score"] for t in tickers]
    avg = sum(scores) / len(scores)
    return {
        "sector_key": sector_key,
        "sector_name": SECTOR_MAP[sector_key]["name"],
        "combined_score": round(avg, 4),
        "label": _label(avg),
        "ticker_scores": dict(zip(tickers, scores)),
    }


def _label(score: float) -> str:
    if score >= 0.5:
        return "Extremely Bullish"
    elif score >= 0.25:
        return "Bullish"
    elif score >= 0.05:
        return "Slightly Bullish"
    elif score >= -0.05:
        return "Neutral"
    elif score >= -0.25:
        return "Slightly Bearish"
    elif score >= -0.5:
        return "Bearish"
    else:
        return "Extremely Bearish"


def get_acceleration_alerts(threshold_pct: float = 200.0) -> list[dict]:
    """Return tickers with mention spikes above threshold in the last 3h."""
    cutoff = (datetime.now() - timedelta(hours=3)).isoformat()
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        SELECT ticker, source, mention_count, prev_count, pct_change, logged_at
        FROM mention_log
        WHERE pct_change >= ? AND logged_at >= ?
        ORDER BY pct_change DESC
        """,
        (threshold_pct, cutoff),
    )
    rows = cur.fetchall()
    con.close()
    return [
        {
            "ticker": r[0], "source": r[1],
            "mention_count": r[2], "prev_count": r[3],
            "pct_change": r[4], "logged_at": r[5],
        }
        for r in rows
    ]
