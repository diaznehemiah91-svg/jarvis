"""
Slack Bot Integration for Jarvis
Brings Discord alerts, trading signals, briefings, and market intelligence into Slack
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Optional, Dict, List
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

logger = logging.getLogger(__name__)


class JarvisSlackBot:
    """Slack bot for Jarvis trading intelligence and alerts"""

    def __init__(self, bot_token: str, app_token: str):
        """Initialize Slack bot

        Args:
            bot_token: Slack bot token (SLACK_BOT_TOKEN)
            app_token: Slack app token (SLACK_APP_TOKEN)
        """
        self.bot_token = bot_token
        self.app_token = app_token
        self.app = App(token=bot_token)
        self.channel_config = {
            "trading-alerts": {"purpose": "Discord alerts & breakout signals", "color": "#FF0000"},
            "trading-briefing": {"purpose": "Daily trading briefings & analysis", "color": "#00FF00"},
            "positions": {"purpose": "Real-time position updates & P&L", "color": "#0088FF"},
            "market-sentiment": {"purpose": "Market sentiment & regime analysis", "color": "#FFAA00"},
            "risk-alerts": {"purpose": "Position protection & risk warnings", "color": "#FF6600"},
        }

        self._setup_handlers()

    def _setup_handlers(self):
        """Setup Slack event handlers"""

        @self.app.event("app_mention")
        def handle_mention(body, say):
            """Handle @Jarvis mentions"""
            user_id = body["event"]["user"]
            text = body["event"]["text"]
            channel = body["event"]["channel"]

            response = self._handle_jarvis_command(text)
            say(f"<@{user_id}> {response}", channel=channel)

    def connect(self):
        """Start Slack bot via Socket Mode"""
        logger.info("🤖 Starting Jarvis Slack Bot...")
        try:
            handler = SocketModeHandler(self.app, self.app_token)
            handler.start()
        except Exception as e:
            logger.error(f"❌ Slack bot connection error: {e}")
            raise

    def post_discord_alert(self, alert_data: Dict):
        """Post a Discord alert to trading-alerts channel

        Args:
            alert_data: Alert dictionary from discord_client
            {
                "timestamp": "2026-07-10T14:32:15Z",
                "channel": "options-signal",
                "source_author": "AdminName",
                "signal_type": "breakout_alert",
                "ticker": "AAPL",
                "price_level": 195.50,
                "direction": "up",
                "conviction_level": "high",
                "target": 198.00,
                "stop_loss": 192.00,
                "time_extracted": "14:32",
                "message_preview": "AAPL breakout above $195 on heavy volume",
                "admin_alert": False
            }
        """
        try:
            # Determine color based on signal type
            color = "#FF0000" if alert_data.get("direction") == "up" else "#00FF00"
            if alert_data.get("admin_alert"):
                color = "#FF6600"  # Orange for admin

            # Build block layout
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚨 {alert_data.get('signal_type', 'SIGNAL').upper()} - {alert_data.get('ticker', 'N/A')}",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Direction:* {'📈 UP' if alert_data.get('direction') == 'up' else '📉 DOWN'}\n*Level:* ${alert_data.get('price_level', 'N/A')}\n*Target:* ${alert_data.get('target', 'N/A')}\n*Stop:* ${alert_data.get('stop_loss', 'N/A')}"
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": f"https://finviz.com/chart.ashx?t={alert_data.get('ticker', 'SPY')}&ty=c&ta=1&p=1d",
                        "alt_text": "Chart"
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"📍 *{alert_data.get('channel', 'unknown')}* | 👤 {alert_data.get('source_author', 'System')} | ⏰ {alert_data.get('time_extracted', 'N/A')} {'🔴 ADMIN' if alert_data.get('admin_alert') else ''}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"_{alert_data.get('message_preview', 'No preview')}_"
                    }
                }
            ]

            self.app.client.chat_postMessage(
                channel="trading-alerts",
                blocks=blocks,
                text=f"{alert_data.get('ticker')} {alert_data.get('direction')} alert"
            )

            logger.info(f"✅ Posted alert to Slack: {alert_data.get('ticker')}")
        except Exception as e:
            logger.error(f"Failed to post alert: {e}")

    def post_daily_briefing(self, briefing_data: Dict):
        """Post daily trading briefing

        Args:
            briefing_data: Daily briefing summary
        """
        try:
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "📊 DAILY TRADING BRIEFING",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Total Trades*\n{briefing_data.get('total_trades', 0)}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Win Rate*\n{briefing_data.get('win_rate', 0):.1f}%"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*P&L*\n${briefing_data.get('total_profit_loss', 0)}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Best Trade*\n{briefing_data.get('best_trade', 'N/A')}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Market Regime:* {briefing_data.get('market_regime', 'Unknown')}\n*Sentiment Trend:* {briefing_data.get('sentiment_trend', 'N/A')}\n*Strategies Used:* {', '.join(briefing_data.get('strategies_used', []))}"
                    }
                },
                {
                    "type": "divider"
                }
            ]

            self.app.client.chat_postMessage(
                channel="trading-briefing",
                blocks=blocks,
                text="Daily Trading Briefing"
            )

            logger.info("✅ Posted daily briefing to Slack")
        except Exception as e:
            logger.error(f"Failed to post briefing: {e}")

    def post_position_update(self, position_data: Dict):
        """Post position update to positions channel

        Args:
            position_data: Position information
        """
        try:
            pnl_color = "#00FF00" if position_data.get("pnl", 0) >= 0 else "#FF0000"

            blocks = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{position_data.get('symbol', 'N/A')}* - {position_data.get('name', 'Unknown')}"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Qty*\n{position_data.get('quantity', 0)}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Avg Cost*\n${position_data.get('avg_cost', 0):.2f}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Current*\n${position_data.get('current_price', 0):.2f}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*P&L* _{pnl_color}_\n${position_data.get('pnl', 0):.2f} ({position_data.get('pnl_percent', 0):.2f}%)"
                        }
                    ]
                }
            ]

            self.app.client.chat_postMessage(
                channel="positions",
                blocks=blocks,
                text=f"{position_data.get('symbol')} position update"
            )

            logger.info(f"✅ Posted position update: {position_data.get('symbol')}")
        except Exception as e:
            logger.error(f"Failed to post position: {e}")

    def post_market_sentiment(self, sentiment_data: Dict):
        """Post market sentiment analysis

        Args:
            sentiment_data: Sentiment analysis
        """
        try:
            sentiment_score = sentiment_data.get("sentiment_score", 0)
            sentiment_emoji = "🟢" if sentiment_score > 0.3 else "🟡" if sentiment_score > -0.3 else "🔴"
            interpretation = sentiment_data.get("interpretation", "Neutral")

            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{sentiment_emoji} MARKET SENTIMENT ANALYSIS",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Sentiment Score*\n{sentiment_score:.2f}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Interpretation*\n{interpretation}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Bullish*\n{sentiment_data.get('bullish_count', 0)}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Bearish*\n{sentiment_data.get('bearish_count', 0)}"
                        }
                    ]
                },
                {
                    "type": "divider"
                }
            ]

            self.app.client.chat_postMessage(
                channel="market-sentiment",
                blocks=blocks,
                text="Market Sentiment Update"
            )

            logger.info("✅ Posted market sentiment to Slack")
        except Exception as e:
            logger.error(f"Failed to post sentiment: {e}")

    def post_risk_alert(self, risk_data: Dict):
        """Post risk/position protection alert

        Args:
            risk_data: Risk alert information
        """
        try:
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "⚠️ POSITION PROTECTION ALERT",
                        "emoji": True
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Alert:* {risk_data.get('change', 'Market shift detected')}\n*Recommendation:* {risk_data.get('recommendation', 'Review positions')}\n*Affected:* {', '.join(risk_data.get('affected_positions', []))}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Positions"
                            },
                            "url": "http://localhost:8000/positions",
                            "style": "danger"
                        }
                    ]
                }
            ]

            self.app.client.chat_postMessage(
                channel="risk-alerts",
                blocks=blocks,
                text="Risk Alert"
            )

            logger.info("✅ Posted risk alert to Slack")
        except Exception as e:
            logger.error(f"Failed to post risk alert: {e}")

    def _handle_jarvis_command(self, text: str) -> str:
        """Handle @Jarvis commands

        Examples:
        - "@Jarvis what's the market sentiment"
        - "@Jarvis show today's P&L"
        - "@Jarvis check breakouts"
        """
        text_lower = text.lower()

        if "sentiment" in text_lower:
            return "Market sentiment analysis coming from Discord feed. Currently analyzing Stock Chat sentiment..."
        elif "pnl" in text_lower or "profit" in text_lower:
            return "Fetching today's P&L from trading log..."
        elif "breakout" in text_lower:
            return "Scanning for active breakout alerts from options-signal channel..."
        elif "positions" in text_lower:
            return "Retrieving Webull positions..."
        elif "signals" in text_lower:
            return "Latest trading signals from Discord monitored channels..."
        else:
            return "📊 I'm your trading intelligence assistant. Try: @Jarvis sentiment, @Jarvis pnl, @Jarvis breakouts, @Jarvis positions"

    def create_channels_if_needed(self):
        """Create required Slack channels if they don't exist"""
        try:
            for channel_name, config in self.channel_config.items():
                try:
                    self.app.client.conversations_create(name=channel_name)
                    logger.info(f"✅ Created channel: #{channel_name}")
                except:
                    logger.info(f"Channel #{channel_name} already exists")
        except Exception as e:
            logger.error(f"Failed to create channels: {e}")


# ═══ Standalone Functions ═════════════════════════════════════════════════════

def get_slack_bot(bot_token=None, app_token=None):
    """Get or create Slack bot instance

    Args:
        bot_token: Slack bot token (defaults to env var)
        app_token: Slack app token (defaults to env var)

    Returns:
        JarvisSlackBot instance
    """
    if bot_token is None:
        bot_token = os.environ.get("SLACK_BOT_TOKEN")
    if app_token is None:
        app_token = os.environ.get("SLACK_APP_TOKEN")

    if not bot_token or not app_token:
        raise ValueError(
            "Slack tokens not provided. Set SLACK_BOT_TOKEN and SLACK_APP_TOKEN "
            "environment variables."
        )

    return JarvisSlackBot(bot_token, app_token)


# ═══ Example Usage ═════════════════════════════════════════════════════════════

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    bot_token = os.environ.get("SLACK_BOT_TOKEN")
    app_token = os.environ.get("SLACK_APP_TOKEN")

    if not bot_token or not app_token:
        print("❌ Error: SLACK_BOT_TOKEN and SLACK_APP_TOKEN not set")
        print("\nTo run this bot:")
        print("1. Create Slack app at: https://api.slack.com/apps")
        print("2. Enable Socket Mode")
        print("3. Get Bot Token (xoxb-...) and App Token (xapp-...)")
        print("4. Run: SLACK_BOT_TOKEN='xoxb-...' SLACK_APP_TOKEN='xapp-...' python engine/trading/slack_client.py")
    else:
        bot = get_slack_bot(bot_token, app_token)
        bot.create_channels_if_needed()
        bot.connect()
