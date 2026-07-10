# Slack Bot Setup Guide - Jarvis in Your Workspace

**Purpose**: Integrate Jarvis into Slack as your primary trading intelligence hub  
**Time Required**: 15-20 minutes  
**Difficulty**: Easy

---

## 🎯 Why Slack?

Slack is where the **real work happens**. Instead of switching between web UIs:
- ✅ Discord alerts → Posted to Slack automatically
- ✅ Daily briefings → Sent to #trading-briefing channel
- ✅ Position updates → Real-time in #positions channel
- ✅ Market sentiment → Analyzed and posted to #market-sentiment
- ✅ Risk alerts → Position protection warnings in #risk-alerts

**Result**: Everything your trading operation needs in one workspace.

---

## 🤖 Architecture Overview

```
┌─────────────────────────────────────────┐
│  Jarvis (Main Orchestrator)             │
│  - Coordinates all trading functions    │
│  - Processes Discord intelligence       │
│  - Generates briefings & alerts         │
└────────────┬────────────────────────────┘
             │
             ├─→ #trading-alerts (Breakout signals)
             ├─→ #trading-briefing (Daily analysis)
             ├─→ #positions (Live P&L tracking)
             ├─→ #market-sentiment (Regime analysis)
             └─→ #risk-alerts (Position protection)
             │
┌────────────┴────────────────────────────┐
│  Individual Agents (Parallel Tasks)     │
│  - Customer Service Agent              │
│  - Ads Optimization Agent              │
│  - Content Posting Agent               │
│  - Development Agent                   │
│  (All interconnected via Slack)        │
└─────────────────────────────────────────┘
```

Jarvis is the **main operator**, but you can have **separate agents** working on different business functions in parallel, all coordinating through Slack channels.

---

## 🚀 Step 1: Create Slack App

### 1a. Go to Slack Developer Dashboard
1. Open: https://api.slack.com/apps
2. Click: **"Create New App"**
3. Choose: **"From scratch"**
4. Name: `Jarvis`
5. Select your workspace
6. Click: **"Create App"**

### 1b. Enable Socket Mode
1. In left sidebar, click: **"Socket Mode"**
2. Toggle: **"Enable Socket Mode"** (ON)
3. Name the token: `jarvis-socket-token`
4. Click: **"Generate"**
5. Copy the token (starts with `xapp-`)
   ```
   SLACK_APP_TOKEN = "xapp-..."  (save this!)
   ```

---

## 🔐 Step 2: Set Bot Permissions

### 2a. Configure Bot Token Scopes
1. In left sidebar, click: **"OAuth & Permissions"**
2. Scroll to: **"Scopes"** → **"Bot Token Scopes"**
3. Add these scopes:
   - ✅ `channels:manage`
   - ✅ `channels:read`
   - ✅ `chat:write`
   - ✅ `chat:write.public`
   - ✅ `users:read`
   - ✅ `messages:read`

### 2b. Get Bot Token
1. Scroll up to: **"OAuth Tokens for Your Workspace"**
2. Click: **"Install to Workspace"** (if not done yet)
3. Click: **"Allow"**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
   ```
   SLACK_BOT_TOKEN = "xoxb-..."  (save this!)
   ```

### 2c. Enable Event Subscriptions
1. In left sidebar, click: **"Event Subscriptions"**
2. Toggle: **"Enable Events"** (ON)
3. Under **"Subscribe to bot events"**, add:
   - ✅ `app_mention`
   - ✅ `message.channels`

---

## 📝 Step 3: Configure Jarvis

### 3a. Add Tokens to Environment

**Option A: Environment Variables** (Recommended)
```bash
export SLACK_BOT_TOKEN="xoxb-your-token-here"
export SLACK_APP_TOKEN="xapp-your-token-here"
python3 /home/user/jarvis/jarvis_boot.py
```

**Option B: In engine/config.py**
```python
# Add to engine/config.py:
_SLACK_BOT_TOKEN_HARDCODED = "xoxb-..."
_SLACK_APP_TOKEN_HARDCODED = "xapp-..."
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "") or _SLACK_BOT_TOKEN_HARDCODED
SLACK_APP_TOKEN = os.environ.get("SLACK_APP_TOKEN", "") or _SLACK_APP_TOKEN_HARDCODED
```

**Option C: In .env file**
```bash
# Create .env in /home/user/jarvis/
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...

# Then run:
source .env
python3 jarvis_boot.py
```

### 3b. Install Required Package
```bash
pip install slack-bolt
```

---

## ✅ Step 4: Create Jarvis Slack Channels

### 4a. Create Channels
In your Slack workspace, create these channels:

1. **#trading-alerts** — Discord alerts & breakout signals
2. **#trading-briefing** — Daily trading briefings & analysis
3. **#positions** — Real-time position updates & P&L
4. **#market-sentiment** — Market sentiment & regime analysis
5. **#risk-alerts** — Position protection & risk warnings

### 4b. Set Channel Description
For each channel:
1. Click channel name at top
2. Click: **"Edit channel details"**
3. Add description (see 4a above)
4. Click: **"Save"**

### 4c. Invite Jarvis Bot
For each channel:
1. Right-click channel name
2. Select: **"View channel details"**
3. Click: **"Integrations"**
4. Click: **"Add an app"**
5. Search: **"Jarvis"**
6. Click: **"Add"**

---

## 🚀 Step 5: Start Jarvis Slack Bot

### 5a. Run Bot in Background
```bash
cd /home/user/jarvis

# Option 1: Direct run (for testing)
SLACK_BOT_TOKEN="xoxb-..." SLACK_APP_TOKEN="xapp-..." python3 engine/trading/slack_client.py

# Option 2: Background task
SLACK_BOT_TOKEN="xoxb-..." SLACK_APP_TOKEN="xapp-..." nohup python3 engine/trading/slack_client.py > slack_bot.log &

# Option 3: Via Jarvis with bot enabled
python3 jarvis_boot.py
# Bot will auto-start with Jarvis
```

### 5b: Verify Bot is Connected
```bash
# Check logs
tail -f slack_bot.log

# Look for:
# ✅ 🤖 Starting Jarvis Slack Bot...
# ✅ Created channel: #trading-alerts
# ✅ Socket Mode Connected
```

**When you see these messages, bot is running!** ✅

---

## 💬 Step 6: Test the Integration

### 6a. Post a Test Alert
```python
from engine.trading.slack_client import get_slack_bot

bot = get_slack_bot()

# Test alert
alert = {
    "timestamp": "2026-07-10T14:32:15Z",
    "channel": "options-signal",
    "source_author": "TestAdmin",
    "signal_type": "breakout_alert",
    "ticker": "AAPL",
    "price_level": 195.50,
    "direction": "up",
    "target": 198.00,
    "stop_loss": 192.00,
    "time_extracted": "14:32",
    "message_preview": "AAPL breakout above $195 on heavy volume",
    "admin_alert": False
}

bot.post_discord_alert(alert)
```

### 6b. Check Slack
1. Go to your Slack workspace
2. Open **#trading-alerts** channel
3. You should see the test alert posted with:
   - ✅ Ticker and direction
   - ✅ Price level, target, stop loss
   - ✅ Source channel and author
   - ✅ Timestamp

**Bot is working!** ✅

---

## 🔗 Step 7: Connect Discord Bot to Slack

### 7a. Modify Discord Client
In `engine/trading/discord_client.py`, add Slack posting:

```python
from engine.trading.slack_client import get_slack_bot

class DiscordIntelligenceBeast:
    def __init__(self, token):
        # ... existing code ...
        self.slack_bot = get_slack_bot()  # Initialize Slack bot
    
    async def process_honey_drip_message(self, message):
        # ... existing parsing ...
        
        # NEW: Post to Slack if it's a signal
        if signal_type in ["breakout_alert", "swing_trade", "aristotle_trade"]:
            self.slack_bot.post_discord_alert({
                "timestamp": datetime.now().isoformat(),
                "channel": message.channel.name,
                "source_author": message.author.name,
                "signal_type": signal_type,
                "ticker": extracted_ticker,
                "price_level": extracted_price,
                # ... rest of alert data ...
            })
```

### 7b. Verify Discord → Slack Flow
1. Post a message in your Discord #options-signal channel
2. Within 60 seconds, it should appear in Slack #trading-alerts
3. Check the message is formatted correctly

---

## 📊 Step 8: Wire Up Dashboard

### 8a. Add Slack Endpoints to Frontend
In `www/command/app.js`:

```javascript
// Get latest Discord alert from Slack
eel.getLatestBreakoutAlert()(function(result) {
    if (result.status === "success" && result.alert) {
        displayLatestAlert(result.alert);
    }
});

// Post daily briefing to Slack
function sendDailyBriefingToSlack(briefingData) {
    eel.postDailyBriefingToSlack(briefingData)(function(result) {
        console.log("Briefing posted to Slack:", result);
    });
}

// Send position update to Slack
function updatePositionInSlack(positionData) {
    eel.postPositionUpdateToSlack(positionData)(function(result) {
        console.log("Position posted to Slack:", result);
    });
}
```

### 8b. Update Dashboard Display
Add widgets to show:
- ✅ Latest alert from #trading-alerts
- ✅ Today's briefing from #trading-briefing
- ✅ Current positions from #positions
- ✅ Market sentiment from #market-sentiment

---

## 🎯 Multi-Agent Architecture (Advanced)

### Setup Individual Agents
Since agents are separate, you can have them work on different tasks:

```
Jarvis (Main)
├── Trading Agent (your existing Discord bot)
│   └── Posts: alerts, briefings, positions, sentiment
│
├── Customer Service Agent
│   └── Monitors: #customer-emails, #customer-reviews
│   └── Posts: solutions, follow-ups
│
├── Ads Optimization Agent
│   └── Monitors: #ads-report, #ads-optimizations
│   └── Posts: recommendations, performance
│
├── Content Agent
│   └── Monitors: #content-posting
│   └── Posts: scheduling, performance metrics
│
└── Dev Agent
    └── Monitors: #dev
    └── Posts: deployments, updates
```

### Create Separate Bots (Optional)
Each agent can be its own bot:
```bash
# Trading Bot (Jarvis)
SLACK_BOT_TOKEN="xoxb-trading" python3 engine/trading/slack_client.py

# Customer Service Bot
SLACK_BOT_TOKEN="xoxb-customer" python3 engine/agents/customer_service_bot.py

# Ads Bot
SLACK_BOT_TOKEN="xoxb-ads" python3 engine/agents/ads_bot.py

# Content Bot
SLACK_BOT_TOKEN="xoxb-content" python3 engine/agents/content_bot.py

# Dev Bot
SLACK_BOT_TOKEN="xoxb-dev" python3 engine/agents/dev_bot.py
```

All agents post to shared Slack channels for visibility and coordination.

---

## 🌐 Step 9: Deploy on Chrome (Your Laptop)

### 9a. Run Jarvis Web UI
```bash
cd /home/user/jarvis
python3 jarvis_boot.py
```

This starts:
- ✅ Jarvis web UI on `http://localhost:8000`
- ✅ Discord bot (listening to Discord)
- ✅ Slack bot (posting to Slack)
- ✅ API endpoints

### 9b. Open on Chrome
1. Open Chrome on your laptop
2. Go to: `http://localhost:8000`
3. You now have:
   - Jarvis web dashboard
   - Slack integration active
   - Discord monitoring active
   - All alerts flowing through

### 9c. Keep Terminal Running
Keep the terminal window open:
```bash
# Terminal stays open, showing logs from:
# - Discord bot connecting
# - Slack bot posting
# - API requests being handled
```

---

## 📱 Slack Mobile Setup

You can now check Jarvis alerts on your phone:

1. Install Slack app on phone
2. Open your workspace
3. Watch #trading-alerts, #positions channels
4. Get notifications for breakouts, risk alerts, etc.

This way you can monitor trades from anywhere.

---

## ✅ Troubleshooting

### "Bot not connecting to Slack"
```
❌ Error: Failed to connect to Socket Mode

Solution:
1. Verify SLACK_APP_TOKEN is correct (starts with xapp-)
2. Verify SLACK_BOT_TOKEN is correct (starts with xoxb-)
3. Check Slack API dashboard — is Socket Mode enabled?
4. Verify token hasn't expired
5. Try creating new tokens
```

### "Messages not posting to Slack"
```
❌ Bot in workspace but alerts don't appear

Solution:
1. Verify channels exist: #trading-alerts, #trading-briefing, etc.
2. Verify bot has been added to each channel
3. Verify bot has `chat:write` permission
4. Check logs: tail -f slack_bot.log
5. Try posting manually in Python shell
```

### "Discord alerts not showing in Slack"
```
❌ Discord bot running but no Slack posts

Solution:
1. Verify Discord bot is connected: check Discord logs
2. Verify Slack bot is connected: check Slack logs
3. Check discord_client.py has Slack posting code
4. Verify alert parsing is working
5. Make a test Discord post in #options-signal
```

### "Tokens invalid/expired"
```
❌ Error: 401 Unauthorized

Solution:
1. Go to Slack API dashboard
2. Regenerate both tokens (Bot Token + App Token)
3. Update environment variables
4. Restart Jarvis bot
```

---

## 🎉 Success Checklist

- [ ] Created Slack app at api.slack.com/apps
- [ ] Enabled Socket Mode
- [ ] Got Bot Token (xoxb-...) and App Token (xapp-...)
- [ ] Added OAuth scopes
- [ ] Installed slack-bolt (`pip install slack-bolt`)
- [ ] Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN env vars
- [ ] Created 5 required Slack channels
- [ ] Invited Jarvis bot to each channel
- [ ] Started Slack bot: `python3 engine/trading/slack_client.py`
- [ ] Verified connection: checked logs for "Socket Mode Connected"
- [ ] Posted test alert — verified it shows in Slack
- [ ] Connected Discord alerts to Slack posting
- [ ] Tested Discord → Slack flow
- [ ] Opened Chrome on laptop to http://localhost:8000
- [ ] Watched alerts flow through Slack channels
- [ ] Tested on mobile Slack app

**You now have Jarvis running in Slack!** 🚀

---

## 🔗 Resources

**Slack API Docs**: https://api.slack.com/docs  
**slack-bolt SDK**: https://slack.dev/bolt-python/  
**Socket Mode**: https://api.slack.com/socket-mode  

---

## 📊 What's Next?

1. **Connect Discord bot** to automatically post alerts to Slack
2. **Add Webull positions** to #positions channel
3. **Create daily briefing** that posts to #trading-briefing at 9 AM
4. **Add market sentiment** updates to #market-sentiment channel
5. **Setup risk alerts** that post to #risk-alerts when market shifts
6. **Build individual agents** for other business functions (optional)
7. **Monitor on mobile** using Slack app on your phone

---

**Status**: Ready to Deploy  
**Deployment**: Chrome on your laptop at http://localhost:8000  
**Next**: Follow steps 1-9 above, takes ~20 minutes

