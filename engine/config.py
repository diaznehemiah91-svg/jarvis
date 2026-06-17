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
