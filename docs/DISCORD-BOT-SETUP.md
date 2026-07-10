# Discord Bot Setup Guide - Live Updates to Jarvis

**Purpose**: Connect Discord #honey-drip channel to Jarvis for live trading updates  
**Time Required**: 10-15 minutes  
**Difficulty**: Easy

---

## 🤖 Step 1: Create Discord Bot

### 1a. Go to Discord Developer Portal
1. Open: https://discord.com/developers/applications
2. Click: **"New Application"**
3. Name it: `Jarvis` (or your preference)
4. Click: **"Create"**

### 1b. Add Bot User
1. In left sidebar, click: **"Bot"**
2. Click: **"Add Bot"**
3. You now have a bot user!

### 1c. Get Bot Token
1. Under **"TOKEN"** section, click: **"Copy"**
2. Save this somewhere safe (you'll need it)
   ```
   YOUR_BOT_TOKEN_HERE (save this!)
   ```

**⚠️ WARNING**: Never share this token publicly!

---

## 🔐 Step 2: Set Bot Permissions

### 2a. Configure Permissions
In Developer Portal, under your bot:

1. Click: **"OAuth2"** in left sidebar
2. Click: **"URL Generator"**
3. Select these **SCOPES**:
   - ✅ `bot`

4. Select these **PERMISSIONS**:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Mention @everyone, @here, and All Roles
   - ✅ Use External Emojis

### 2b. Get Bot Invite URL
1. Copy the **Generated URL** from URL Generator
2. Open in browser
3. Select your Discord server
4. Click: **"Authorize"**
5. Complete CAPTCHA if prompted

**Bot is now in your server!** ✅

---

## 📝 Step 3: Configure Jarvis

### 3a. Add Token to Config

**Option A: Environment Variable** (Recommended)
```bash
export DISCORD_BOT_TOKEN="your_bot_token_here"
python3 /home/user/jarvis/jarvis_boot.py
```

**Option B: In engine/config.py**
```python
# Add to engine/config.py:
DISCORD_BOT_TOKEN = "your_bot_token_here"
```

**Option C: In .env file**
```bash
# Create .env in /home/user/jarvis/
DISCORD_BOT_TOKEN=your_bot_token_here

# Then run:
source .env
python3 jarvis_boot.py
```

### 3b. Verify Installation
```bash
# Check if discord.py is installed
pip list | grep discord

# If not installed:
pip install discord.py
```

---

## ✅ Step 4: Create #honey-drip Channel

### 4a. Create Channel
1. In your Discord server
2. Right-click channel list
3. Click: **"Create Channel"**
4. Name: `honey-drip`
5. Type: **Text**
6. Click: **"Create"**

### 4b. Set Channel Permissions
1. Right-click `#honey-drip` → **"Edit Channel"**
2. Click: **"Permissions"**
3. Find your bot user
4. Grant:
   - ✅ View Channel
   - ✅ Send Messages
   - ✅ Read Message History

5. Click: **"Save Changes"**

---

## 🚀 Step 5: Start Bot

### 5a. Run Bot in Background
```bash
cd /home/user/jarvis

# Option 1: Direct run (for testing)
DISCORD_BOT_TOKEN="your_token" python3 engine/trading/discord_client.py

# Option 2: Background task
DISCORD_BOT_TOKEN="your_token" nohup python3 engine/trading/discord_client.py > discord_bot.log &

# Option 3: Via Jarvis with bot enabled
python3 jarvis_boot.py
# Bot will auto-start with Jarvis
```

### 5b: Verify Bot is Connected
```bash
# Check logs
tail -f discord_bot.log

# Look for:
# ✅ Discord Bot Connected as Jarvis#1234
# 📍 Server: Your_Server_Name
# #️⃣ honey-drip (ID: 123456789)
```

**When you see these messages, bot is running!** ✅

---

## 💬 Step 6: Test It Out

### 6a. Send a Message
1. Go to Discord
2. Open `#honey-drip` channel
3. Send a test message:
   ```
   BUY AAPL @ $150
   Entry: $150, Target: $160, Stop: $145
   ```

### 6b. Check Bot Response
In your terminal/logs, you should see:
```
🍯 Honey Drip Update from YourName:
   BUY AAPL @ $150...

📊 Parsed Signal: {'action': 'BUY', ...}
```

**Bot is working!** ✅

---

## 🔗 Step 7: Integrate with Jarvis API

### 7a. Add API Endpoints
```python
# In engine/trading/api.py, add:

from engine.trading.discord_client import fetch_honey_drip_updates

@eel.expose
def getDiscordUpdates(limit: int = 10):
    """Fetch recent honey-drip updates from Discord"""
    updates = fetch_honey_drip_updates(limit)
    return json.dumps(updates)

@eel.expose
def getLatestSignal():
    """Get the most recent trading signal from Discord"""
    updates = fetch_honey_drip_updates(1)
    return json.dumps(updates[0] if updates else {})
```

### 7b. Test in Dashboard
```javascript
// In www/command/app.js, add:

eel.getDiscordUpdates(5)(function(updates) {
    console.log("Latest Discord updates:", updates);
    displayUpdates(updates);
});
```

---

## 📊 Understanding the Bot

### What It Does
1. **Connects** to Discord server
2. **Monitors** #honey-drip channel
3. **Logs** all messages
4. **Parses** trading signals (BUY, SELL, HOLD, etc.)
5. **Caches** last 100 messages
6. **Exposes** API endpoint to fetch updates

### Message Format
```
Author: YourName
Timestamp: 2026-06-26T20:30:45
Channel: honey-drip
Content: "BUY AAPL @ $150, Target $160, Stop $145"
Parsed: {'action': 'BUY', 'symbol': 'AAPL', ...}
```

### Signal Parsing
Bot recognizes:
- `BUY AAPL @ $150`
- `SELL NVDA at $400`
- `HOLD TSLA`
- `Entry: $100, Target: $120, Stop: $95`
- Any message with: BUY, SELL, HOLD, ENTRY, TARGET, STOP

---

## 🔧 Configuration Reference

### Bot Settings
```python
# In discord_client.py

class JarvisDiscordBot:
    MONITOR_INTERVAL = 5  # Check every 5 minutes
    CACHE_SIZE = 100      # Keep last 100 messages
    CHANNEL_NAME = "honey-drip"  # Channel to monitor
```

### Environment Variables
```bash
# Required
DISCORD_BOT_TOKEN=your_bot_token_here

# Optional (defaults provided)
DISCORD_CHANNEL=honey-drip
DISCORD_GUILD_ID=your_server_id  # For multi-server setup
```

### Config File
```python
# In engine/config.py
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
DISCORD_CHANNEL = "honey-drip"
DISCORD_AUTO_START = True  # Start bot with Jarvis
```

---

## ✅ Troubleshooting

### "Bot not connecting"
```
❌ Error: Failed to login - check bot token

Solution:
1. Verify token is correct (copy from Developer Portal again)
2. Check Discord API status: https://discordstatus.com
3. Ensure bot is in server (OAuth2 step)
4. Verify token has no extra spaces/quotes
```

### "Bot in server but not responding"
```
❌ No messages logged from #honey-drip

Solution:
1. Check bot has permissions in channel
2. Verify channel is named exactly "honey-drip"
3. Check bot is "online" in Discord
4. Manually send message and check logs
5. Restart bot: Ctrl+C, then run again
```

### "Token error"
```
❌ Error: discord.errors.HTTPException: 401 Unauthorized

Solution:
1. Create new token (old one might be expired)
2. Update DISCORD_BOT_TOKEN
3. Re-run bot with new token
```

### "Can't see bot in member list"
```
❌ Bot doesn't appear in Discord server

Solution:
1. Go back to Developer Portal
2. OAuth2 → URL Generator
3. Re-generate invite link
4. Add bot to server again
```

---

## 🎯 Advanced Features

### Auto-Trading Integration (Coming Soon)
```python
# Could implement:
# 1. Parse signal from Discord
# 2. Validate against honey-drip strategy
# 3. Execute trade on Webull
# 4. Post confirmation to Discord
```

### Multi-Channel Support
```python
# Monitor multiple channels:
CHANNELS_TO_MONITOR = [
    "honey-drip",
    "trading-signals",
    "market-alerts"
]
```

### Webhook Integration
```python
# Send alerts back to Discord:
webhook = DiscordWebhook(url="...")
webhook.send(f"Position Updated: AAPL +$500")
```

---

## 📋 Quick Checklist

- [ ] Created Discord bot at developer.discord.com
- [ ] Copied bot token
- [ ] Set permissions (read/send messages, read history)
- [ ] Invited bot to server via OAuth2 URL
- [ ] Created #honey-drip channel
- [ ] Installed discord.py (`pip install discord.py`)
- [ ] Set DISCORD_BOT_TOKEN environment variable
- [ ] Started bot: `DISCORD_BOT_TOKEN="token" python3 engine/trading/discord_client.py`
- [ ] Verified bot connects: "✅ Discord Bot Connected"
- [ ] Tested message in #honey-drip
- [ ] Bot logged the message
- [ ] Bot parsed trading signal

---

## 🔗 Links & Resources

**Discord Developer Portal**: https://discord.com/developers/applications  
**discord.py Documentation**: https://discordpy.readthedocs.io/  
**Discord API Docs**: https://discord.com/developers/docs/  

**Your Bot Invite URL**:
```
https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID&scope=bot&permissions=PERMISSIONS
```

---

## 📞 Support

**Bot won't connect?**
- Check token in Developer Portal
- Verify bot is in server
- Check Discord status page

**Bot not reading messages?**
- Verify channel is #honey-drip
- Check bot has message read permission
- Check message contains BUY/SELL/HOLD keywords

**Need help?**
- Check `discord_bot.log` for errors
- Review discord.py docs
- Try creating new bot token

---

## 🎉 Success!

When working properly, your Discord bot will:
1. ✅ Show online in your Discord server
2. ✅ Read messages from #honey-drip
3. ✅ Parse trading signals
4. ✅ Log updates to console/file
5. ✅ Expose API endpoint in Jarvis
6. ✅ Display live updates in dashboard

**You now have live Discord → Jarvis integration!** 🚀

---

**Status**: Ready to Deploy  
**Next**: Follow steps 1-7 above, takes ~15 minutes
