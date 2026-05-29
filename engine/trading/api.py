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
from engine.trading.opportunities import (
    get_top_opportunities, get_options_ideas, get_sector_heatmap, score_ticker,
)

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


# ── Opportunities & Options ───────────────────────────────────────────────────

@eel.expose
def getOpportunities(limit: int = 12):
    return json.dumps(get_top_opportunities(limit))


@eel.expose
def getOptionsIdeas(limit: int = 10):
    return json.dumps(get_options_ideas(limit))


@eel.expose
def getSectorHeatmap():
    return json.dumps(get_sector_heatmap())


@eel.expose
def getTickerAssessment(ticker: str):
    return json.dumps(score_ticker(ticker))


# ── News engine ───────────────────────────────────────────────────────────────

@eel.expose
def getCompanyNews(ticker: str, limit: int = 12):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_company_news(ticker, limit))


@eel.expose
def getMarketNews(limit: int = 20):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_market_news(limit))


@eel.expose
def getPowerNews(limit: int = 15):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_power_news(None, limit))


@eel.expose
def getNewsStatus():
    from engine.trading import news_aggregator as na
    return json.dumps(na.status())


# ── Whole-market ticker search ──────────────────────────────────────────────────

@eel.expose
def searchTicker(query: str, limit: int = 15):
    from engine.trading.tickers import search_ticker
    return json.dumps(search_ticker(query, limit))


# ── Data source status ────────────────────────────────────────────────────────

@eel.expose
def getDataStatus():
    from engine.trading import finnhub_client as finnhub
    return json.dumps(finnhub.status())


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
