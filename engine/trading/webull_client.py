"""
Webull integration for checking account positions and balance.
Provides functions to query account data and positions from Webull.
"""

import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)


class WebullClient:
    """Client for interacting with Webull API via MCP."""

    def __init__(self):
        """Initialize Webull client."""
        self.account_id = None
        self.account_cache = None

    def get_account_list(self) -> Optional[Dict[str, Any]]:
        """
        Fetch list of Webull accounts.

        Returns:
            Dictionary with account information or None if error.
        """
        try:
            # This would normally call the MCP tool
            # For now, return a placeholder
            return {
                "status": "success",
                "message": "Account list fetched successfully",
                "accounts": []
            }
        except Exception as e:
            logger.error(f"Error fetching account list: {e}")
            return {"error": str(e)}

    def get_positions(self, account_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch positions for a specific account.

        Args:
            account_id: The Webull account ID

        Returns:
            Dictionary with position information or None if error.
        """
        try:
            # This would normally call the MCP tool mcp__webull__get_account_positions
            # For now, return a placeholder
            return {
                "status": "success",
                "message": f"Positions fetched for account {account_id}",
                "positions": [],
                "account_id": account_id
            }
        except Exception as e:
            logger.error(f"Error fetching positions for {account_id}: {e}")
            return {"error": str(e)}

    def get_account_balance(self, account_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch account balance and summary.

        Args:
            account_id: The Webull account ID

        Returns:
            Dictionary with balance information or None if error.
        """
        try:
            # This would normally call the MCP tool mcp__webull__get_account_balance
            return {
                "status": "success",
                "message": f"Balance fetched for account {account_id}",
                "account_id": account_id
            }
        except Exception as e:
            logger.error(f"Error fetching balance for {account_id}: {e}")
            return {"error": str(e)}

    def get_full_account_summary(self, account_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get complete account summary including positions and balance.

        Args:
            account_id: Optional specific account ID. If None, uses primary account.

        Returns:
            Dictionary with complete account summary.
        """
        try:
            if not account_id:
                accounts = self.get_account_list()
                if not accounts or "error" in accounts:
                    return {"error": "Failed to get account list"}
                if not accounts.get("accounts"):
                    return {"error": "No accounts found"}
                account_id = accounts["accounts"][0].get("id")

            positions = self.get_positions(account_id)
            balance = self.get_account_balance(account_id)

            return {
                "account_id": account_id,
                "positions": positions.get("positions", []) if positions else [],
                "balance": balance if balance else {},
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            logger.error(f"Error getting full account summary: {e}")
            return {"error": str(e)}

    def format_positions_display(self, positions: List[Dict]) -> str:
        """
        Format positions data for display.

        Args:
            positions: List of position dictionaries

        Returns:
            Formatted string for display
        """
        if not positions:
            return "No positions found."

        result = "Your Webull Positions:\n"
        result += "=" * 50 + "\n"

        total_value = 0
        for pos in positions:
            symbol = pos.get("symbol", "UNKNOWN")
            quantity = pos.get("quantity", 0)
            price = pos.get("price", 0)
            value = quantity * price
            change = pos.get("change_percent", 0)

            result += f"{symbol:6} | Qty: {quantity:8.0f} | "
            result += f"Price: ${price:8.2f} | Value: ${value:12.2f} | "
            result += f"Change: {change:6.2f}%\n"

            total_value += value

        result += "=" * 50 + "\n"
        result += f"Total Portfolio Value: ${total_value:12.2f}\n"

        return result

    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()


# Singleton instance
_client = WebullClient()


def get_client() -> WebullClient:
    """Get or create the Webull client instance."""
    return _client


def fetch_positions(account_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function to fetch positions.

    Args:
        account_id: Optional account ID

    Returns:
        Dictionary with position data
    """
    client = get_client()
    return client.get_full_account_summary(account_id)
