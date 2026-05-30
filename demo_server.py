"""
Demo Flask server that serves the JARVIS www/ directory and provides
mock API endpoints that mimic the Eel backend, so the dashboard
can be screenshotted without Eel installed.
"""
import json, os, sys, threading
from datetime import datetime
from flask import Flask, send_from_directory, jsonify

# Resolve paths relative to this file so it runs on any machine / OS.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WWW_DIR = os.path.join(BASE_DIR, 'www')
sys.path.insert(0, BASE_DIR)

# Bootstrap DB and run one pass of mock sentiment so we have data
from engine.trading.db_schema import init_trading_db
from engine.trading.sentiment import score_reddit, score_news
from engine.trading.tickers import SECTOR_MAP, get_all_tickers
from engine.trading.regime import compute_regime_score, detect_rotation
from engine.trading.alerts import generate_full_briefing, get_dca_candidates
from engine.trading.flow_tracker import get_recent_alerts, map_flow_ripple, run_full_scan
from engine.trading.sentiment import get_sector_sentiment
from engine.trading.opportunities import (
    get_top_opportunities, get_options_ideas, get_sector_heatmap, score_ticker,
)

init_trading_db()
score_reddit()
score_news()
# Seed an initial institutional-flow scan so the feed is populated on first load
try:
    run_full_scan()
except Exception as _e:
    print('initial flow scan skipped:', _e)

app = Flask(__name__, static_folder=WWW_DIR)

# ── Serve static files ────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(WWW_DIR, 'index.html')

@app.route('/trading/')
@app.route('/trading/index.html')
def trading():
    return send_from_directory(os.path.join(WWW_DIR, 'trading'), 'index.html')

@app.route('/trading/<path:path>')
def trading_static(path):
    return send_from_directory(os.path.join(WWW_DIR, 'trading'), path)

@app.route('/command/')
@app.route('/command/index.html')
def command():
    return send_from_directory(os.path.join(WWW_DIR, 'command'), 'index.html')

@app.route('/command/<path:path>')
def command_static(path):
    return send_from_directory(os.path.join(WWW_DIR, 'command'), path)

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(WWW_DIR, path)

# ── Mock eel.js ───────────────────────────────────────────────────────────────
@app.route('/eel.js')
def eel_js():
    """
    Shim matching Eel's actual double-call pattern:
      eel.functionName(arg1, arg2)()   → Promise<result>
      eel.functionName(arg1)(callback) → calls callback(result)
    """
    js = r"""
window.eel = new Proxy({}, {
  get(_, name) {
    // First call: capture the Python-side arguments
    return (...args) => {
      // Second call: optional callback, returns Promise
      return (callback) => {
        const p = fetch('/api/' + name, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(args)
        })
        .then(r => r.json())
        .then(data => data.result)
        .catch(e => { console.error('[eel-shim]', name, e); return '{}'; });

        if (typeof callback === 'function') p.then(callback);
        return p;
      };
    };
  }
});
"""
    from flask import Response
    return Response(js, mimetype='application/javascript')

# ── API dispatcher ────────────────────────────────────────────────────────────
HANDLERS = {}

def api(name):
    def decorator(fn):
        HANDLERS[name] = fn
        return fn
    return decorator

@app.route('/api/<name>', methods=['POST'])
def api_handler(name):
    args = []
    try:
        args = flask_request_json() or []
    except Exception:
        pass
    handler = HANDLERS.get(name)
    if handler:
        try:
            result = handler(*args)
            return jsonify({"result": result})
        except Exception as e:
            return jsonify({"result": "{}", "error": str(e)})
    return jsonify({"result": "{}"})

from flask import request as flask_req
def flask_request_json():
    return flask_req.get_json(silent=True) or []

# ── API handlers ──────────────────────────────────────────────────────────────

@api('getSectorMap')
def getSectorMap():
    return json.dumps(SECTOR_MAP)

@api('getAllTickers')
def getAllTickers():
    return json.dumps(get_all_tickers())

@api('computeRegime')
def computeRegime():
    return json.dumps(compute_regime_score())

@api('getCurrentRegime')
def getCurrentRegime():
    return json.dumps(compute_regime_score())

@api('detectRotation')
def detectRotation():
    return json.dumps(detect_rotation())

@api('getFullBriefing')
def getFullBriefing():
    return json.dumps(generate_full_briefing())

@api('getDcaCandidates')
def getDcaCandidates():
    regime = compute_regime_score()
    return json.dumps(get_dca_candidates(regime))

@api('getSectorSentiment')
def getSectorSentiment(sector_key='compute_silicon'):
    return json.dumps(get_sector_sentiment(sector_key))

@api('getSectorSnapshot')
def getSectorSnapshot(sector_key='compute_silicon'):
    from engine.trading.market_data import get_sector_snapshot
    return json.dumps(get_sector_snapshot(sector_key))

@api('getRecentAlerts')
def getRecentAlerts(hours=24):
    return json.dumps(get_recent_alerts(hours))

@api('getFlowRipple')
def getFlowRipple(ticker='NVDA'):
    return json.dumps(map_flow_ripple(ticker))

@api('getAccelerationAlerts')
def getAccelerationAlerts():
    from engine.trading.sentiment import get_acceleration_alerts
    return json.dumps(get_acceleration_alerts())

@api('getRegimeHistory')
def getRegimeHistory(days=7):
    from engine.trading.regime import get_regime_history
    return json.dumps(get_regime_history(days))

@api('refreshMarketData')
def refreshMarketData():
    return json.dumps({"status": "ok"})

@api('triggerBackgroundRefresh')
def triggerBackgroundRefresh():
    return json.dumps({"status": "refresh_started"})

@api('runRedditSentiment')
def runRedditSentiment():
    return json.dumps(score_reddit())

@api('runNewsSentiment')
def runNewsSentiment(key=''):
    return json.dumps(score_news(key))

@api('getTickerSentiment')
def getTickerSentiment(ticker='NVDA'):
    from engine.trading.sentiment import get_aggregate_sentiment
    return json.dumps(get_aggregate_sentiment(ticker))

@api('getOpportunities')
def getOpportunities(limit=12):
    return json.dumps(get_top_opportunities(limit))

@api('getOptionsIdeas')
def getOptionsIdeas(limit=24):
    return json.dumps(get_options_ideas(limit))

@api('getSectorHeatmap')
def getSectorHeatmap():
    return json.dumps(get_sector_heatmap())

@api('getTickerAssessment')
def getTickerAssessment(ticker='NVDA'):
    return json.dumps(score_ticker(ticker))

@api('runFlowScan')
def runFlowScan(tradier_token='', unusual_whales_key=''):
    return json.dumps(run_full_scan(tradier_token, unusual_whales_key))

@api('getDataStatus')
def getDataStatus():
    from engine.trading import finnhub_client as finnhub
    return json.dumps(finnhub.status())

@api('setApiKey')
def setApiKey(provider='finnhub', key=''):
    from engine.trading import finnhub_client as finnhub
    if provider == 'finnhub':
        return json.dumps(finnhub.set_key(key))
    return json.dumps({"error": f"unknown provider {provider}"})

@api('getCompanyNews')
def getCompanyNews(ticker='NVDA', limit=12):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_company_news(ticker, limit))

@api('getMarketNews')
def getMarketNews(limit=20):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_market_news(limit))

@api('getPowerNews')
def getPowerNews(limit=15):
    from engine.trading import news_aggregator as na
    return json.dumps(na.get_power_news(None, limit))

@api('getNewsStatus')
def getNewsStatus():
    from engine.trading import news_aggregator as na
    return json.dumps(na.status())

@api('searchTicker')
def searchTicker(query='', limit=15):
    from engine.trading.tickers import search_ticker
    return json.dumps(search_ticker(query, limit))

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8765, debug=False)
