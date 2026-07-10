import os

ASSISTANT_NAME = "jarvis"

# ── LLM (optional, add later) ─────────────────────────────────────────────────
# Gemini / other LLM key. Leave blank until you wire it up.
LLM_KEY = os.environ.get("GEMINI_API_KEY", "")

# ── Market data: Finnhub (free tier) ──────────────────────────────────────────
# Get a free key at https://finnhub.io/register.
#
# Two ways to provide it (either works):
#   1) Set the FINNHUB_API_KEY environment variable (recommended), OR
#   2) Paste your key directly between the quotes on the _HARDCODED line below.
#
# IMPORTANT: only put your key in the quotes on the _HARDCODED line. Do NOT
# change the os.environ.get("FINNHUB_API_KEY", ...) part — that name is the
# environment-variable lookup, not your key.
_FINNHUB_KEY_HARDCODED = ""   # e.g. "d8cit31r01qidic84es0..."
FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY", "") or _FINNHUB_KEY_HARDCODED

# ── Social / news feeds (optional) ────────────────────────────────────────────
# X / Twitter requires a paid API plan. When you have a Bearer token, set the
# X_BEARER_TOKEN env var and JARVIS will pull instant headlines from the handles
# in X_NEWS_HANDLES (e.g. Walter Bloomberg, breaking-news accounts). Until then
# the social source stays dormant and the free sources (Finnhub, Reddit, RSS)
# carry the news feed.
X_BEARER_TOKEN = os.environ.get("X_BEARER_TOKEN", "")
X_NEWS_HANDLES = ["DeItaone", "FirstSquawk", "Reuters", "realDonaldTrump"]

# Keyless RSS news sources scanned daily for market + per-ticker headlines.
RSS_FEEDS = [
    ("Reuters Markets", "https://www.reutersagency.com/feed/?best-topics=business-finance"),
    ("CNBC Markets", "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664"),
    ("MarketWatch Top", "https://feeds.content.dowjones.io/public/rss/mw_topstories"),
    ("Yahoo Finance", "https://finance.yahoo.com/news/rssindex"),
]

# ── Optional premium flow APIs (add later if you want) ────────────────────────
UNUSUAL_WHALES_KEY = os.environ.get("UNUSUAL_WHALES_KEY", "")
TRADIER_TOKEN = os.environ.get("TRADIER_TOKEN", "")
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "")

# ── Discord Bot (for live trading updates from #honey-drip) ──────────────────
# Get bot token from Discord Developer Portal: https://discord.com/developers/applications
#
# Setup:
#   1) Create bot at Discord Developer Portal
#   2) Copy bot token
#   3) Set DISCORD_BOT_TOKEN env var or paste below
#   4) Create #honey-drip channel in your Discord server
#   5) Invite bot to server using OAuth2 URL
#   6) Bot will monitor #honey-drip for trading signals
#
# Two ways to provide it (either works):
#   1) Set the DISCORD_BOT_TOKEN environment variable (recommended), OR
#   2) Paste your token directly between the quotes on the _HARDCODED line below.
_DISCORD_TOKEN_HARDCODED = ""  # e.g. "MjM4NDk0NjM1MTk2MDI..."
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "") or _DISCORD_TOKEN_HARDCODED
DISCORD_CHANNEL = "honey-drip"  # Channel to monitor for trading signals
DISCORD_AUTO_START = True  # Auto-start bot when Jarvis launches

# ── Slack Bot (for trading intelligence in Slack workspace) ──────────────────
# Get tokens from Slack API: https://api.slack.com/apps
#
# Setup:
#   1) Create Slack app at https://api.slack.com/apps
#   2) Enable Socket Mode
#   3) Get Bot Token (xoxb-...) and App Token (xapp-...)
#   4) Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN env vars
#   5) Bot will post: Discord alerts, daily briefings, position updates, market sentiment
#
# Two ways to provide it (either works):
#   1) Set the SLACK_BOT_TOKEN and SLACK_APP_TOKEN environment variables (recommended), OR
#   2) Paste your tokens directly between the quotes on the _HARDCODED lines below.
_SLACK_BOT_TOKEN_HARDCODED = ""  # e.g. "xoxb-1234567890..."
_SLACK_APP_TOKEN_HARDCODED = ""  # e.g. "xapp-abcd1234..."
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "") or _SLACK_BOT_TOKEN_HARDCODED
SLACK_APP_TOKEN = os.environ.get("SLACK_APP_TOKEN", "") or _SLACK_APP_TOKEN_HARDCODED
SLACK_AUTO_START = True  # Auto-start Slack bot with Jarvis

# Slack channels for different intelligence streams
SLACK_CHANNELS = {
    "trading-alerts": "Discord alerts & breakout signals",
    "trading-briefing": "Daily trading briefings & analysis",
    "positions": "Real-time position updates & P&L",
    "market-sentiment": "Market sentiment & regime analysis",
    "risk-alerts": "Position protection & risk warnings",
}
