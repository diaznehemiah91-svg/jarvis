"""
Discord Bot Integration for Jarvis
Connects to Discord channels (#honey-drip) and imports trading signals/updates
"""

import os
import logging
import asyncio
from datetime import datetime
import discord
from discord.ext import commands, tasks

logger = logging.getLogger(__name__)

class JarvisDiscordBot:
    """Discord bot for receiving honey-drip trading signals and updates"""

    def __init__(self, token):
        """Initialize Discord bot

        Args:
            token: Discord bot token from environment or config
        """
        self.token = token
        self.bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())
        self.channel_id = None  # Will be set based on channel name
        self.messages_cache = []

        # Setup event handlers
        self._setup_events()

    def _setup_events(self):
        """Setup Discord event handlers"""

        @self.bot.event
        async def on_ready():
            """Called when bot successfully connects to Discord"""
            logger.info(f"✅ Discord Bot Connected as {self.bot.user}")
            logger.info(f"Bot ID: {self.bot.user.id}")
            logger.info(f"Connected to {len(self.bot.guilds)} server(s)")

            # Print all channels
            for guild in self.bot.guilds:
                logger.info(f"\n📍 Server: {guild.name}")
                for channel in guild.text_channels:
                    logger.info(f"   #️⃣  {channel.name} (ID: {channel.id})")

            # Start background tasks
            self.monitor_honey_drip.start()

        @self.bot.event
        async def on_message(message):
            """Called for every message in channels the bot can see"""
            # Ignore bot's own messages
            if message.author == self.bot.user:
                return

            # Log honey-drip channel messages
            if message.channel.name == "honey-drip":
                await self.process_honey_drip_message(message)

            # Process commands
            await self.bot.process_commands(message)

    async def process_honey_drip_message(self, message):
        """Process messages from #honey-drip channel

        Args:
            message: Discord message object
        """
        entry = {
            "timestamp": datetime.now().isoformat(),
            "author": message.author.name,
            "content": message.content,
            "channel": message.channel.name,
            "message_id": message.id,
        }

        self.messages_cache.append(entry)

        # Log the message
        logger.info(f"🍯 Honey Drip Update from {message.author.name}:")
        logger.info(f"   {message.content[:100]}...")

        # Parse trading signals if any
        signals = self.parse_trading_signal(message.content)
        if signals:
            logger.info(f"📊 Parsed Signal: {signals}")
            # Could update database, notify Jarvis, etc.

    @staticmethod
    def parse_trading_signal(content):
        """Parse trading signals from message content

        Looks for patterns like:
        - BUY AAPL @ $150
        - SELL NVDA at $400
        - HOLD TSLA
        - Entry: $100, Target: $120, Stop: $95

        Args:
            content: Message text to parse

        Returns:
            dict with parsed signal or None
        """
        content_upper = content.upper()

        # Look for action keywords
        actions = ["BUY", "SELL", "HOLD", "ENTRY", "TARGET", "STOP"]

        signal = None
        for action in actions:
            if action in content_upper:
                signal = {
                    "action": action,
                    "raw": content,
                    "parsed_at": datetime.now().isoformat(),
                }
                break

        return signal

    @tasks.loop(minutes=5)
    async def monitor_honey_drip(self):
        """Background task to monitor honey-drip channel periodically"""
        try:
            # Find honey-drip channel
            for guild in self.bot.guilds:
                for channel in guild.text_channels:
                    if channel.name == "honey-drip":
                        # Fetch recent messages
                        async for message in channel.history(limit=10):
                            # Process if not already cached
                            if not any(m["message_id"] == message.id for m in self.messages_cache):
                                await self.process_honey_drip_message(message)
        except Exception as e:
            logger.error(f"Error monitoring honey-drip: {e}")

    def get_recent_signals(self, limit=10):
        """Get recent trading signals from cache

        Args:
            limit: Number of recent messages to return

        Returns:
            List of message entries
        """
        return self.messages_cache[-limit:]

    def connect(self):
        """Start the Discord bot connection"""
        logger.info("🤖 Starting Discord Bot...")
        try:
            self.bot.run(self.token)
        except discord.errors.LoginFailure:
            logger.error("❌ Failed to login - check bot token")
            raise
        except Exception as e:
            logger.error(f"❌ Bot connection error: {e}")
            raise


# ═══ Standalone Functions ═════════════════════════════════════════════════════

def get_discord_bot(token=None):
    """Get or create Discord bot instance

    Args:
        token: Discord bot token (defaults to env var)

    Returns:
        JarvisDiscordBot instance
    """
    if token is None:
        token = os.environ.get("DISCORD_BOT_TOKEN")

    if not token:
        raise ValueError(
            "No Discord token provided. Set DISCORD_BOT_TOKEN environment variable "
            "or pass token parameter."
        )

    return JarvisDiscordBot(token)


def fetch_honey_drip_updates(limit=5):
    """Convenience function to fetch recent honey-drip updates

    Args:
        limit: Number of recent updates to return

    Returns:
        List of update dictionaries
    """
    try:
        bot = get_discord_bot()
        return bot.get_recent_signals(limit)
    except Exception as e:
        logger.error(f"Failed to fetch updates: {e}")
        return []


# ═══ Example Usage ═════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Get token from environment
    token = os.environ.get("DISCORD_BOT_TOKEN")

    if not token:
        print("❌ Error: DISCORD_BOT_TOKEN not set")
        print("\nTo run this bot:")
        print("1. Create bot at: https://discord.com/developers/applications")
        print("2. Copy bot token")
        print("3. Run: DISCORD_BOT_TOKEN='your_token' python engine/trading/discord_client.py")
    else:
        # Start bot
        bot = get_discord_bot(token)
        bot.connect()
