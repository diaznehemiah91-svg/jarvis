"""
Eel-exposed API endpoints for the Institutional Flow Tracker dashboard.
Import this module in main.py to register all @eel.expose endpoints.
"""
import json
import threading

import eel

from engine.trading.db_schema import init_trading_db
from engine.trading.tickers import SECTOR_MAP, get_all_tickers
from engine.trading.market_data import (
    get_sector_snapshot, refresh_all_tickers, get_technical_bias,
)
from engine.trading.sentiment import (
    score_reddit, score_news, get_aggregate_sentiment,
    get_sector_sentiment, get_acceleration_alerts,
)
from engine.trading.regime import (
    compute_regime_score, detect_rotation,
    get_regime_history, get_current_regime,
)
from engine.trading.flow_tracker import (
    run_full_scan, get_recent_alerts, map_flow_ripple,
)
from engine.trading.alerts import generate_full_briefing, get_dca_candidates

# Initialize DB on import
init_trading_db()


# ── Sector & Ticker data ──────────────────────────────────────────────────────

@eel.expose
def getSectorMap():
    return json.dumps(SECTOR_MAP)


@eel.expose
def getAllTickers():
    return json.dumps(get_all_tickers())


@eel.expose
def getSectorSnapshot(sector_key: str):
    data = get_sector_snapshot(sector_key)
    return json.dumps(data)


@eel.expose
def refreshMarketData():
    result = refresh_all_tickers()
    return json.dumps(result)


# ── Sentiment ─────────────────────────────────────────────────────────────────

@eel.expose
def runRedditSentiment():
    result = score_reddit()
    return json.dumps(result)


@eel.expose
def runNewsSentiment(alpha_vantage_key: str = ""):
    result = score_news(alpha_vantage_key)
    return json.dumps(result)


@eel.expose
def getTickerSentiment(ticker: str):
    return json.dumps(get_aggregate_sentiment(ticker))


@eel.expose
def getSectorSentiment(sector_key: str):
    return json.dumps(get_sector_sentiment(sector_key))


@eel.expose
def getAccelerationAlerts():
    return json.dumps(get_acceleration_alerts())


# ── Regime ────────────────────────────────────────────────────────────────────

@eel.expose
def computeRegime():
    result = compute_regime_score()
    return json.dumps(result)


@eel.expose
def getCurrentRegime():
    result = get_current_regime()
    return json.dumps(result)


@eel.expose
def getRegimeHistory(days: int = 7):
    return json.dumps(get_regime_history(days))


@eel.expose
def detectRotation():
    return json.dumps(detect_rotation())


# ── Flow tracker ──────────────────────────────────────────────────────────────

@eel.expose
def runFlowScan(tradier_token: str = "", unusual_whales_key: str = ""):
    result = run_full_scan(tradier_token, unusual_whales_key)
    return json.dumps(result)


@eel.expose
def getRecentAlerts(hours: int = 24):
    return json.dumps(get_recent_alerts(hours))


@eel.expose
def getFlowRipple(ticker: str):
    return json.dumps(map_flow_ripple(ticker))


# ── Full briefing ─────────────────────────────────────────────────────────────

@eel.expose
def getFullBriefing():
    briefing = generate_full_briefing()
    return json.dumps(briefing)


@eel.expose
def getDcaCandidates():
    regime = get_current_regime() or {}
    return json.dumps(get_dca_candidates(regime))


# ── Background refresh ────────────────────────────────────────────────────────

def _background_refresh():
    """Runs in a daemon thread — refreshes market data then triggers sentiment."""
    refresh_all_tickers()
    score_reddit()
    score_news()


@eel.expose
def triggerBackgroundRefresh():
    t = threading.Thread(target=_background_refresh, daemon=True)
    t.start()
    return json.dumps({"status": "refresh_started"})
