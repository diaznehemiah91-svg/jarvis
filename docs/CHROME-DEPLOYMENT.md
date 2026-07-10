# Chrome Deployment - Jarvis on Your Laptop

**Deploy Jarvis web UI and all background services on your laptop via Chrome**

---

## 🚀 Quick Start (5 Minutes)

### 1. Pull Latest Code
```bash
cd /home/user/jarvis
git fetch origin
git checkout claude/webull-positions-check-25xes3
git pull origin claude/webull-positions-check-25xes3
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
pip install slack-bolt  # For Slack bot
pip install discord.py  # For Discord bot (if not already installed)
```

### 3. Set Environment Variables
```bash
export SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
export SLACK_APP_TOKEN="xapp-your-slack-app-token"
export DISCORD_BOT_TOKEN="your-discord-bot-token"
```

Or create `.env` file in `/home/user/jarvis/`:
```bash
# .env file
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
```

Then load it:
```bash
source .env
```

### 4. Start Jarvis
```bash
cd /home/user/jarvis
python3 jarvis_boot.py
```

### 5. Open Chrome
Open Chrome and go to: **http://localhost:8000**

---

## 📊 What Starts with Jarvis

When you run `python3 jarvis_boot.py`, you get:

✅ **Jarvis Web UI** — http://localhost:8000
- Dashboard with market data
- Trading analytics
- Voice command interface
- Webull positions display

✅ **Discord Bot** — Listening to Discord channels
- Monitors: #stock-chat, #options-signal, #small-challenge, #10k-challenge
- Checks every 60 seconds
- Parses: breakouts, swing trades, Aristotle's trades
- Caches last 150 messages per channel

✅ **Slack Bot** — Posting to Slack workspace
- #trading-alerts: Discord alerts & breakout signals
- #trading-briefing: Daily trading briefings
- #positions: Real-time position updates
- #market-sentiment: Market sentiment analysis
- #risk-alerts: Position protection warnings

✅ **API Endpoints** — For dashboard integration
- Webull endpoints: getWebullPositions, getWebullAccountBalance
- Discord endpoints: getDiscordAlerts, getBreakoutAlerts
- Slack endpoints: postDiscordAlertToSlack, postDailyBriefingToSlack
- And 20+ more endpoints

---

## 🔌 Hardware Setup (Your Laptop)

### Monitors
- **Monitor 1** (Left): Chrome browser with Jarvis UI
- **Monitor 2** (Right): Slack workspace (for real-time alerts)
- **Monitor 3** (Optional): Discord for manual monitoring

### Chrome Window
- Full screen on one monitor
- URL: http://localhost:8000
- Watch alerts flow in real-time

### Slack Window
- Visible on second monitor
- Alerts post automatically
- Mobile notifications on phone

---

## 📱 Mobile Monitoring (Optional)

### Slack on Phone
1. Install Slack app on your phone
2. Open your workspace
3. Watch these channels:
   - #trading-alerts (breakouts)
   - #positions (real-time P&L)
   - #risk-alerts (position protection)

You get push notifications for important alerts even when away from desk.

---

## 🛠️ System Requirements

### Minimum
- Laptop with Python 3.8+
- 4GB RAM
- Chrome browser
- Internet connection

### Recommended
- Laptop with Python 3.10+
- 8GB RAM
- Multiple monitors (3)
- High-speed internet
- Unmetered bandwidth (for real-time streaming)

---

## 📋 Pre-Launch Checklist

Before starting Jarvis, verify:

- [ ] **Slack Bot Tokens Set**
  ```bash
  echo $SLACK_BOT_TOKEN  # Should output xoxb-...
  echo $SLACK_APP_TOKEN  # Should output xapp-...
  ```

- [ ] **Discord Bot Token Set**
  ```bash
  echo $DISCORD_BOT_TOKEN  # Should output token
  ```

- [ ] **Slack Channels Created**
  - #trading-alerts
  - #trading-briefing
  - #positions
  - #market-sentiment
  - #risk-alerts

- [ ] **Jarvis Bot Added to Channels**
  - Right-click each channel
  - View channel details
  - Add app: Jarvis

- [ ] **Discord Server Configured**
  - Bot has read permissions on all monitored channels
  - Channels created: #stock-chat, #options-signal, #small-challenge, #10k-challenge
  - Bot is in your Discord server

- [ ] **Port 8000 Available**
  ```bash
  lsof -i :8000  # Should show nothing
  ```

---

## 🚀 Launch Sequence

### Terminal 1: Main Jarvis Process
```bash
cd /home/user/jarvis
source .env  # Load tokens
python3 jarvis_boot.py
```

Expected output:
```
✅ Jarvis starting...
✅ Web UI server started on http://localhost:8000
✅ Discord bot connecting...
✅ Discord Bot Connected as Jarvis
✅ Slack bot connecting...
✅ 🤖 Starting Jarvis Slack Bot...
✅ Socket Mode Connected
✅ API endpoints ready
```

### Chrome Tab 1: Jarvis Dashboard
Open: http://localhost:8000
- Verify you see: Market data, positions, alerts
- Test clicking buttons
- Check console for errors (F12)

### Chrome Tab 2: Slack
Open: https://your-slack-workspace.slack.com
- Watch #trading-alerts for incoming alerts
- Watch #positions for updates
- Watch #risk-alerts for warnings

### Phone: Slack App
- Open Slack app
- See push notifications for alerts
- Can respond to alerts on phone

---

## 🔄 Real-Time Workflow

### Every Minute (Discord Bot)
```
1. Check 4 Discord channels
2. Fetch last 150 messages from each
3. Parse trading signals
4. Extract: breakouts, swing trades, Aristotle trades
5. Label with: channel, author, time, signal type
```

### When Signal Detected
```
1. Parse: ticker, price, direction, target, stop
2. Create alert object
3. Post to Slack #trading-alerts
4. Post to Jarvis dashboard
5. Check position protection (market shift detection)
6. If risk detected → Post to #risk-alerts
```

### Every 24 Hours (Daily Briefing)
```
1. Compile trading log: what, how, when, risk, volume
2. Calculate: P&L, win rate, time decay
3. Post to #trading-briefing
4. Post summary to dashboard
5. Update market regime analysis
```

### Continuous (Market Sentiment)
```
1. Analyze Stock Chat sentiment
2. Count bullish/bearish keywords
3. Calculate sentiment score
4. Post to #market-sentiment
5. Feed into market shift detection
```

---

## 🎯 Using Jarvis

### Voice Commands (Desktop)
```
"Hey Jarvis, check my Webull positions"
"What's the market sentiment?"
"Show me today's P&L"
"Any breakouts happening?"
"Check position protection"
```

### Slack Commands
```
"@Jarvis sentiment" → Get market sentiment
"@Jarvis pnl" → Show today's P&L
"@Jarvis breakouts" → List breakout alerts
"@Jarvis positions" → Get Webull positions
"@Jarvis signals" → Latest trading signals
```

### Dashboard (Chrome)
- Click buttons for various queries
- Watch real-time updates
- See Discord alerts as they come in
- View positions and P&L

---

## 🐛 Troubleshooting

### Port 8000 Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port in jarvis_boot.py
```

### Slack Bot Not Posting
```bash
# Check logs
tail -f slack_bot.log

# Verify tokens
echo $SLACK_BOT_TOKEN

# Test manually
python3 -c "from engine.trading.slack_client import get_slack_bot; bot = get_slack_bot(); print('Connected!')"
```

### Discord Bot Not Reading Messages
```bash
# Check logs
grep "Discord Bot" slack_bot.log

# Verify bot is in server
# Verify bot has permissions
# Verify channels exist
```

### Chrome Not Connecting to Localhost
```bash
# Verify server is running
curl http://localhost:8000

# Check Chrome console (F12)
# Check if port changed in logs
```

---

## 📊 Multi-Monitor Layout (Recommended)

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│                         │                         │                         │
│   Chrome: Jarvis UI     │   Slack Workspace       │   Discord (Optional)    │
│   (Full Screen)         │   (Alerts in Real-Time) │   (Manual Monitoring)   │
│                         │                         │                         │
│   • Dashboard           │   #trading-alerts       │   #stock-chat           │
│   • Market Data         │   #positions            │   #options-signal       │
│   • Voice Commands      │   #market-sentiment     │   #small-challenge      │
│   • Positions           │   #risk-alerts          │   #10k-challenge        │
│   • Briefing            │   #trading-briefing     │                         │
│                         │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────┐
│        Jarvis Main Process                  │
│  (python3 jarvis_boot.py)                   │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────────────────────┐
    │                                 │
    v                                 v
┌─────────────────────┐       ┌──────────────────┐
│  Web UI Server      │       │  Discord Bot     │
│  (Port 8000)        │       │  (Socket-based)  │
│                     │       │                  │
│ Chrome:             │       │ • Monitors 4 chs │
│ localhost:8000      │       │ • 60s intervals  │
│                     │       │ • Parse signals  │
│ • Dashboard         │       │ • Posts to Slack │
│ • Market data       │       │                  │
│ • Voice commands    │       │                  │
│ • Positions         │       │                  │
└─────────────────────┘       └────────┬─────────┘
                                       │
                                       v
                              ┌──────────────────┐
                              │  Slack Bot       │
                              │  (Socket Mode)   │
                              │                  │
                              │ • Posts alerts   │
                              │ • Posts briefing │
                              │ • Posts positions│
                              │ • Posts sentiment│
                              │ • Posts risk     │
                              │                  │
                              │ Slack Workspace: │
                              │ #trading-alerts  │
                              │ #positions       │
                              │ etc.             │
                              └──────────────────┘
```

---

## ✅ Deployment Complete

When you see this in terminal, you're live:

```
✅ Jarvis Web UI Running: http://localhost:8000
✅ Discord Bot Connected: Monitoring 4 channels
✅ Slack Bot Connected: Ready to post alerts
✅ All API Endpoints Ready
✅ Ready for Trading
```

### Next Steps
1. Open Chrome: http://localhost:8000
2. Open Slack: Watch #trading-alerts
3. Keep terminal window visible (shows live logs)
4. Monitor your laptop and phone for alerts
5. Trade with real-time intelligence flowing through Slack

---

## 🎉 You're Now Running Jarvis!

**Status**: Deployed on your laptop  
**UI**: Chrome at http://localhost:8000  
**Intelligence Hub**: Slack workspace  
**Mobile**: Slack app on phone  
**Alerts**: Real-time to Slack channels  
**Trading**: Powered by Discord intelligence + Slack distribution

All systems go! 🚀

