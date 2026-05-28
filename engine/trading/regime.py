"""
REGIME Dashboard — master circuit breaker for the day-trading brain.

Regime Score = (Technical Bias × 0.4) + (News Sentiment × 0.4) + (Reddit Momentum × 0.2)

Regimes:
  risk_on      — Risk-On / Hyper-Growth Momentum
  defensive    — Defensive Rotational (Picks-and-Shovels)
  risk_off     — Risk-Off / Capital Preservation
"""
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from engine.trading.market_data import (
    get_sector_technical_bias, get_vix_level, get_technical_bias,
)
from engine.trading.sentiment import get_sector_sentiment, get_aggregate_sentiment
from engine.trading.tickers import SECTOR_MAP, get_all_tickers

DB_PATH = "jarvis.db"

# Regime thresholds
VIX_RISK_OFF = 22.0
VIX_NEUTRAL = 18.0

REGIME_COLORS = {
    "risk_on": "#00ff88",
    "defensive": "#ffa500",
    "risk_off": "#ff4444",
}

REGIME_LABELS = {
    "risk_on": "RISK-ON / Hyper-Growth Momentum",
    "defensive": "DEFENSIVE ROTATIONAL / Picks & Shovels",
    "risk_off": "RISK-OFF / Capital Preservation",
}


def _con():
    return sqlite3.connect(DB_PATH)


# ── Core scoring ──────────────────────────────────────────────────────────────

def _compute_tech_bias() -> float:
    """
    Average technical bias across the compute_silicon + server_oems sectors
    as the benchmark for AI/tech momentum. Returns [-1, +1].
    """
    ai_sectors = ["compute_silicon", "server_oems", "networking_optics"]
    biases = [get_sector_technical_bias(s) for s in ai_sectors]
    return sum(biases) / len(biases)


def _compute_news_sentiment() -> float:
    """Average news/reddit combined score across all tracked tickers."""
    tickers = get_all_tickers()
    scores = []
    for t in tickers:
        s = get_aggregate_sentiment(t)
        scores.append(s["combined_score"])
    return sum(scores) / len(scores) if scores else 0.0


def _compute_reddit_momentum() -> float:
    """
    Fraction of tickers with positive reddit sentiment, normalized to [-1,+1].
    """
    tickers = get_all_tickers()
    positives = 0
    for t in tickers:
        s = get_aggregate_sentiment(t)
        if s["reddit_score"] > 0.05:
            positives += 1
    ratio = positives / len(tickers) if tickers else 0.5
    return (ratio - 0.5) * 2.0  # map [0,1] → [-1,+1]


def compute_regime_score() -> dict:
    """
    Compute the composite regime score and classify into one of the three regimes.
    """
    tech_bias = _compute_tech_bias()
    news_sent = _compute_news_sentiment()
    reddit_mom = _compute_reddit_momentum()
    vix = get_vix_level()

    raw_score = (tech_bias * 0.4) + (news_sent * 0.4) + (reddit_mom * 0.2)

    # VIX override: hard push to risk-off if VIX spikes
    if vix > VIX_RISK_OFF:
        raw_score = min(raw_score, -0.2)

    regime = _classify(raw_score, vix)
    actions = _regime_actions(regime)

    result = {
        "regime": regime,
        "regime_label": REGIME_LABELS[regime],
        "regime_color": REGIME_COLORS[regime],
        "regime_score": round(raw_score, 4),
        "components": {
            "tech_bias": round(tech_bias, 4),
            "news_sentiment": round(news_sent, 4),
            "reddit_momentum": round(reddit_mom, 4),
        },
        "vix_level": round(vix, 2),
        "actions": actions,
        "snapshot_at": datetime.now().isoformat(),
    }

    _persist_snapshot(result)
    return result


def _classify(score: float, vix: float) -> str:
    if vix > VIX_RISK_OFF or score < -0.15:
        return "risk_off"
    elif score > 0.15:
        return "risk_on"
    else:
        return "defensive"


def _regime_actions(regime: str) -> list[str]:
    actions_map = {
        "risk_on": [
            "Prioritize high-beta tech — long setups in NVDA, ASTS, IONQ",
            "Enable micro-cap momentum scanners",
            "Day trade long bias with normal stop-losses",
            "Watch for CoWoS/packaging breakouts: AMKR, ASX",
        ],
        "defensive": [
            "Flag capital rotation out of NVDA/AMD",
            "Auto-route focus to infrastructure value: VRT, CEG, ETN",
            "Monitor energy utilities for new 52-week highs (VST, NEE)",
            "Reduce position size in speculative names",
        ],
        "risk_off": [
            "TIGHTEN stop-losses on all open day trades immediately",
            "HALT all automated long-bias scanners",
            "Generate DCA buy alerts on discounted mega-caps: NVDA, AMD, MSFT",
            "Monitor VIX for mean-reversion signal below 20",
            "Shift capital to short-duration Treasuries or cash equivalents",
        ],
    }
    return actions_map.get(regime, [])


def _persist_snapshot(result: dict) -> None:
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        INSERT INTO regime_snapshots
            (regime, regime_score, tech_bias, news_sentiment, reddit_momentum, vix_level)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            result["regime"],
            result["regime_score"],
            result["components"]["tech_bias"],
            result["components"]["news_sentiment"],
            result["components"]["reddit_momentum"],
            result["vix_level"],
        ),
    )
    con.commit()
    con.close()


# ── Rotation detector ─────────────────────────────────────────────────────────

def detect_rotation() -> dict:
    """
    Compare AI-hardware bias vs energy/infrastructure bias.
    A divergence signals defensive rotation.
    """
    ai_bias = sum([
        get_sector_technical_bias("compute_silicon"),
        get_sector_technical_bias("server_oems"),
    ]) / 2

    infra_bias = sum([
        get_sector_technical_bias("energy_utilities"),
        get_sector_technical_bias("power_thermal"),
    ]) / 2

    divergence = infra_bias - ai_bias  # positive = rotation toward infra

    return {
        "ai_hardware_bias": round(ai_bias, 4),
        "infrastructure_bias": round(infra_bias, 4),
        "divergence": round(divergence, 4),
        "rotation_signal": divergence > 0.2,
        "narrative": (
            "Capital rotating from AI hardware to energy/infrastructure"
            if divergence > 0.2
            else "No significant rotation detected"
        ),
    }


# ── Regime history ────────────────────────────────────────────────────────────

def get_regime_history(days: int = 7) -> list[dict]:
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        SELECT regime, regime_score, tech_bias, news_sentiment,
               reddit_momentum, vix_level, snapshot_at
        FROM regime_snapshots
        WHERE snapshot_at >= ?
        ORDER BY snapshot_at DESC
        LIMIT 100
        """,
        (cutoff,),
    )
    rows = cur.fetchall()
    con.close()
    cols = ["regime", "regime_score", "tech_bias", "news_sentiment",
            "reddit_momentum", "vix_level", "snapshot_at"]
    return [dict(zip(cols, r)) for r in rows]


def get_current_regime() -> Optional[dict]:
    con = _con()
    cur = con.cursor()
    cur.execute(
        """
        SELECT regime, regime_score, tech_bias, news_sentiment,
               reddit_momentum, vix_level, snapshot_at
        FROM regime_snapshots
        ORDER BY snapshot_at DESC LIMIT 1
        """
    )
    row = cur.fetchone()
    con.close()
    if not row:
        return None
    cols = ["regime", "regime_score", "tech_bias", "news_sentiment",
            "reddit_momentum", "vix_level", "snapshot_at"]
    return dict(zip(cols, row))
