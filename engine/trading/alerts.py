"""
Unified alert engine — aggregates signals from regime, sentiment acceleration,
whale blocks, and options sweeps into prioritized JARVIS alerts.
"""
import json
import sqlite3
from datetime import datetime, timedelta

from engine.trading.flow_tracker import get_recent_alerts, map_flow_ripple
from engine.trading.regime import compute_regime_score, get_current_regime
from engine.trading.sentiment import get_acceleration_alerts, get_aggregate_sentiment
from engine.trading.tickers import SECTOR_MAP

DB_PATH = "jarvis.db"

PRIORITY = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


def _priority_label(score: float, notional: float = 0) -> str:
    if notional >= 50_000_000 or score <= -0.5 or score >= 0.7:
        return "CRITICAL"
    elif notional >= 10_000_000 or abs(score) >= 0.4:
        return "HIGH"
    elif abs(score) >= 0.2:
        return "MEDIUM"
    return "LOW"


def generate_full_briefing() -> dict:
    """
    Produce a complete JARVIS trading briefing combining all signal sources.
    This is the top-level function called by the Eel UI.
    """
    alerts = []

    # 1. Regime assessment
    regime = compute_regime_score()
    alerts.append({
        "type": "REGIME",
        "priority": _regime_priority(regime),
        "title": f"Market Regime: {regime['regime_label']}",
        "body": _regime_body(regime),
        "data": regime,
        "timestamp": regime["snapshot_at"],
    })

    # 2. Sentiment acceleration spikes
    accel_alerts = get_acceleration_alerts(threshold_pct=200.0)
    for a in accel_alerts[:5]:
        alerts.append({
            "type": "SENTIMENT_SPIKE",
            "priority": "HIGH",
            "title": f"MOMENTUM SPIKE: {a['ticker']} mentions +{a['pct_change']:.0f}% on {a['source']}",
            "body": (
                f"{a['ticker']} mentions surged from {a['prev_count']} to "
                f"{a['mention_count']} posts in 3h — institutional/retail crossover signal."
            ),
            "data": a,
            "timestamp": a["logged_at"],
        })

    # 3. Whale block alerts
    flow_alerts = get_recent_alerts(hours=24, alert_type="whale_block")
    for fa in flow_alerts[:5]:
        ripple = map_flow_ripple(fa["ticker"])
        alerts.append({
            "type": "WHALE_BLOCK",
            "priority": _priority_label(0.5, fa.get("size_usd", 0)),
            "title": f"WHALE BLOCK [{fa['direction'].upper()}]: {fa['ticker']} — {fa.get('size_usd', 0):,.0f} USD",
            "body": _whale_body(fa, ripple),
            "data": {**fa, "ripple": ripple},
            "timestamp": fa["alerted_at"],
        })

    # 4. Options sweep alerts
    sweep_alerts = get_recent_alerts(hours=24, alert_type="options_sweep")
    for sa in sweep_alerts[:5]:
        alerts.append({
            "type": "OPTIONS_SWEEP",
            "priority": _priority_label(0.4, sa.get("size_usd", 0)),
            "title": f"SWEEP [{sa['direction'].upper()}]: {sa['ticker']} options — {sa.get('size_usd', 0):,.0f} USD",
            "body": _sweep_body(sa),
            "data": sa,
            "timestamp": sa["alerted_at"],
        })

    # 4b. Insider flow alerts (real smart money via Finnhub)
    insider_alerts = get_recent_alerts(hours=72, alert_type="insider_flow")
    for ia in insider_alerts[:5]:
        d = ia.get("details", {})
        alerts.append({
            "type": "INSIDER_FLOW",
            "priority": _priority_label(0.4, ia.get("size_usd", 0)),
            "title": f"INSIDER [{ia['direction'].upper()}]: {ia['ticker']} — {ia.get('size_usd', 0):,.0f} USD",
            "body": (f"{d.get('transactions', 0)} insider transactions, "
                     f"net {d.get('net_shares', 0):,} shares. Real filings via Finnhub."),
            "data": ia,
            "timestamp": ia["alerted_at"],
        })

    # 5. Sector rotation signal
    from engine.trading.regime import detect_rotation
    rotation = detect_rotation()
    if rotation["rotation_signal"]:
        alerts.append({
            "type": "ROTATION",
            "priority": "HIGH",
            "title": "ROTATION SIGNAL: Capital shifting to Infrastructure",
            "body": rotation["narrative"],
            "data": rotation,
            "timestamp": datetime.now().isoformat(),
        })

    # Sort by priority
    alerts.sort(key=lambda a: PRIORITY.get(a["priority"], 99))

    return {
        "generated_at": datetime.now().isoformat(),
        "regime": regime,
        "total_alerts": len(alerts),
        "alerts": alerts,
    }


def _regime_priority(regime: dict) -> str:
    if regime["regime"] == "risk_off":
        return "CRITICAL"
    elif regime["regime"] == "defensive":
        return "HIGH"
    return "MEDIUM"


def _regime_body(regime: dict) -> str:
    c = regime["components"]
    return (
        f"Score: {regime['regime_score']:+.3f} | "
        f"Tech Bias: {c['tech_bias']:+.3f} | "
        f"News Sent: {c['news_sentiment']:+.3f} | "
        f"Reddit Mom: {c['reddit_momentum']:+.3f} | "
        f"VIX: {regime['vix_level']:.1f}\n"
        f"Actions: {' • '.join(regime['actions'][:2])}"
    )


def _whale_body(alert: dict, ripple: dict) -> str:
    downstream = ", ".join(
        r["sector_name"] for r in ripple.get("ripple_effects", [])
    )
    return (
        f"Dark pool accumulation detected in {alert['ticker']}. "
        f"Volume was {alert.get('details', {}).get('volume_ratio', '?')}× average "
        f"with minimal price movement — institutional signature. "
        f"Supply chain ripple: {downstream or 'none mapped'}."
    )


def _sweep_body(alert: dict) -> str:
    d = alert.get("details", {})
    option_type = d.get("option_type", "option")
    strike = d.get("strike", "?")
    expiry = d.get("expiry", "?")
    return (
        f"Aggressive {option_type} sweep on {alert['ticker']} "
        f"${strike} expiring {expiry}. "
        f"Notional: ${alert.get('size_usd', 0):,.0f}. "
        f"Insider positioning ahead of catalyst likely."
    )


def get_dca_candidates(regime: dict) -> list[dict]:
    """Return DCA buy targets when in risk-off mode."""
    if regime.get("regime") != "risk_off":
        return []

    dca_targets = {
        "NVDA": {"name": "NVIDIA", "rationale": "AI GPU monopoly at discount"},
        "AMD": {"name": "AMD", "rationale": "AI GPU + data center chips"},
        "TSM": {"name": "TSMC", "rationale": "Only leading-edge foundry globally"},
        "ANET": {"name": "Arista Networks", "rationale": "AI network switching backbone"},
        "CEG": {"name": "Constellation Energy", "rationale": "Nuclear baseload for AI data centers"},
    }

    results = []
    for ticker, meta in dca_targets.items():
        sent = get_aggregate_sentiment(ticker)
        results.append({
            "ticker": ticker,
            "name": meta["name"],
            "rationale": meta["rationale"],
            "sentiment": sent["combined_score"],
            "sentiment_label": sent["label"],
        })
    return sorted(results, key=lambda x: x["sentiment"], reverse=True)
