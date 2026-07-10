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
def getOptionsIdeas(limit: int = 24):
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


@eel.expose
def setApiKey(provider: str = "finnhub", key: str = ""):
    """Save an API key/token supplied from the Settings panel (Finnhub / X)."""
    if provider == "finnhub":
        from engine.trading import finnhub_client as finnhub
        return json.dumps(finnhub.set_key(key))
    if provider == "x":
        from engine.trading import news_aggregator as na
        return json.dumps(na.set_x_token(key))
    return json.dumps({"error": f"unknown provider {provider}"})


# ── Webull integration ───────────────────────────────────────────────────────

@eel.expose
def getWebullPositions(account_id: str = ""):
    """Fetch Webull account positions."""
    from engine.trading.webull_client import fetch_positions
    result = fetch_positions(account_id if account_id else None)
    return json.dumps(result)


@eel.expose
def getWebullAccountList():
    """Fetch list of Webull accounts."""
    from engine.trading.webull_client import get_client
    client = get_client()
    result = client.get_account_list()
    return json.dumps(result)


@eel.expose
def getWebullAccountBalance(account_id: str):
    """Fetch Webull account balance."""
    from engine.trading.webull_client import get_client
    client = get_client()
    result = client.get_account_balance(account_id)
    return json.dumps(result)


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


# ── Slack Integration Endpoints ──────────────────────────────────────────────

@eel.expose
def postDiscordAlertToSlack(alert_data):
    """Post a Discord alert to Slack trading-alerts channel

    Args:
        alert_data: Dict with alert info (ticker, price, direction, source, etc)
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        bot.post_discord_alert(alert_data)
        return json.dumps({"status": "posted", "channel": "trading-alerts"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def postDailyBriefingToSlack(briefing_data):
    """Post daily trading briefing to Slack trading-briefing channel

    Args:
        briefing_data: Dict with daily stats (trades, P&L, win_rate, etc)
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        bot.post_daily_briefing(briefing_data)
        return json.dumps({"status": "posted", "channel": "trading-briefing"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def postPositionUpdateToSlack(position_data):
    """Post position update to Slack positions channel

    Args:
        position_data: Dict with position info (symbol, qty, price, P&L, etc)
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        bot.post_position_update(position_data)
        return json.dumps({"status": "posted", "channel": "positions"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def postMarketSentimentToSlack(sentiment_data):
    """Post market sentiment analysis to Slack market-sentiment channel

    Args:
        sentiment_data: Dict with sentiment score, bullish/bearish count, etc
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        bot.post_market_sentiment(sentiment_data)
        return json.dumps({"status": "posted", "channel": "market-sentiment"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def postRiskAlertToSlack(risk_data):
    """Post risk/position protection alert to Slack risk-alerts channel

    Args:
        risk_data: Dict with alert info (change, recommendation, affected_positions)
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        bot.post_risk_alert(risk_data)
        return json.dumps({"status": "posted", "channel": "risk-alerts"})
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def getSlackStatus():
    """Check Slack bot connection status"""
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        return json.dumps({"status": "connected", "app": "JarvisSlackBot"})
    except Exception as e:
        return json.dumps({"status": "disconnected", "error": str(e)})


@eel.expose
def getDiscordAlertsFromSlack(limit=10):
    """Fetch recent Discord alerts from Slack trading-alerts channel

    Args:
        limit: Number of recent alerts to return
    """
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        # Get conversation history
        result = bot.app.client.conversations_history(
            channel="trading-alerts",
            limit=limit
        )
        messages = result.get("messages", [])
        return json.dumps({
            "status": "success",
            "count": len(messages),
            "alerts": messages
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def getLatestBreakoutAlert():
    """Get the most recent breakout alert from Slack"""
    try:
        from engine.trading.slack_client import get_slack_bot
        bot = get_slack_bot()
        result = bot.app.client.conversations_history(
            channel="trading-alerts",
            limit=5
        )
        messages = result.get("messages", [])
        # Return the first (most recent) message
        return json.dumps({
            "status": "success",
            "alert": messages[0] if messages else None
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})


@eel.expose
def getSlackChannels():
    """Get list of Jarvis Slack channels"""
    try:
        channels = {
            "trading-alerts": "Discord alerts & breakout signals",
            "trading-briefing": "Daily trading briefings & analysis",
            "positions": "Real-time position updates & P&L",
            "market-sentiment": "Market sentiment & regime analysis",
            "risk-alerts": "Position protection & risk warnings",
        }
        return json.dumps({
            "status": "success",
            "channels": channels
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
