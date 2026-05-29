import os

ASSISTANT_NAME = "jarvis"

# ── LLM (optional, add later) ─────────────────────────────────────────────────
# Gemini / other LLM key. Leave blank until you wire it up.
LLM_KEY = os.environ.get("GEMINI_API_KEY", "")

# ── Market data: Finnhub (free tier) ──────────────────────────────────────────
# Get a free key at https://finnhub.io/register  → paste it here or set the
# FINNHUB_API_KEY environment variable. With a key, JARVIS pulls real-time
# quotes, analyst recommendations, company news, and insider transactions.
# Without a key it falls back to a realistic simulation so the UI still works.
FINNHUB_KEY = os.environ.get("d8cit31r01qidic84es0d8cit31r01qidic84esg", "")

# ── Optional premium flow APIs (add later if you want) ────────────────────────
UNUSUAL_WHALES_KEY = os.environ.get("UNUSUAL_WHALES_KEY", "")
TRADIER_TOKEN = os.environ.get("TRADIER_TOKEN", "")
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "")
