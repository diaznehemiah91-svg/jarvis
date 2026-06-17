"""
Opportunities Engine — converts raw signals (technicals, sentiment, flow,
regime) into ranked, actionable trade ideas:

  • Buy/Sell opportunities with conviction score, entry/target/stop levels
  • Options ideas (calls/puts) with strike, expiry, and rationale

All ideas are derived from the existing data pipeline so they stay
consistent with the regime and flow modules. Educational/research output —
not financial advice.
"""
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from engine.trading.market_data import fetch_ticker_data, get_technical_bias
from engine.trading.sentiment import get_aggregate_sentiment
from engine.trading.flow_tracker import get_recent_alerts
from engine.trading.regime import get_current_regime, compute_regime_score
from engine.trading.tickers import (
    SECTOR_MAP, get_all_tickers, get_sector_for_ticker,
)

DB_PATH = "jarvis.db"


def _con():
    return sqlite3.connect(DB_PATH)


# ── Flow score per ticker ─────────────────────────────────────────────────────

def _flow_score(ticker: str, hours: int = 48) -> float:
    """Net institutional flow bias for a ticker in [-1, +1]."""
    alerts = get_recent_alerts(hours=hours)
    bull = bear = 0.0
    for a in alerts:
        if a["ticker"] != ticker:
            continue
        weight = min((a.get("size_usd") or 0) / 50_000_000, 1.0)
        if a["direction"] == "bullish":
            bull += 0.5 + 0.5 * weight
        else:
            bear += 0.5 + 0.5 * weight
    net = bull - bear
    return max(-1.0, min(1.0, net))


def _regime_fit(ticker: str, regime: str) -> float:
    """
    How well a ticker fits the current regime, in [-0.3, +0.3].
    Risk-on favors high-beta/frontier; defensive favors infra; risk-off
    favors quality mega-caps.
    """
    sector = get_sector_for_ticker(ticker)
    layer = SECTOR_MAP.get(sector, {}).get("layer", "")
    if regime == "risk_on":
        return {"Frontier": 0.3, "AI Hardware": 0.2, "Infrastructure": 0.0}.get(layer, 0.0)
    elif regime == "defensive":
        return {"Infrastructure": 0.3, "AI Hardware": 0.05, "Frontier": -0.2}.get(layer, 0.0)
    elif regime == "risk_off":
        # Favor quality mega-caps regardless of layer
        return 0.2 if ticker in {"NVDA", "AMD", "TSM", "AVGO", "ANET", "CEG"} else -0.15
    return 0.0


# ── Core opportunity scoring ──────────────────────────────────────────────────

def score_ticker(ticker: str, regime: Optional[str] = None) -> dict:
    """Produce a full opportunity assessment for a single ticker."""
    if regime is None:
        cur = get_current_regime()
        regime = cur["regime"] if cur else "defensive"

    tech = get_technical_bias(ticker)                       # -1..1
    sent_data = get_aggregate_sentiment(ticker)
    sent = sent_data["combined_score"]                      # -1..1
    flow = _flow_score(ticker)                              # -1..1
    fit = _regime_fit(ticker, regime)                       # -0.3..0.3

    # Weighted composite → net signal in roughly [-1, +1]
    net = (tech * 0.30) + (sent * 0.25) + (flow * 0.35) + fit
    net = max(-1.0, min(1.0, net))

    conviction = round(abs(net) * 100)                      # 0..100

    action = _action_from_net(net, regime)

    # Price levels
    rows = fetch_ticker_data(ticker, days=5)
    price = (rows[-1]["close"] if rows and rows[-1].get("close") else None)
    prev_close = (rows[-2]["close"] if len(rows) >= 2 and rows[-2].get("close") else None)
    change_pct = round((price - prev_close) / prev_close * 100, 2) if price and prev_close else None

    entry = target = stop = None
    rr = None
    if price:
        if action in ("STRONG BUY", "BUY", "ACCUMULATE"):
            move = 0.04 + 0.10 * (conviction / 100)        # 4%–14% target
            risk = 0.02 + 0.04 * (conviction / 100)        # 2%–6% stop
            entry = round(price, 2)
            target = round(price * (1 + move), 2)
            stop = round(price * (1 - risk), 2)
            rr = round(move / risk, 2)
        elif action in ("SELL", "AVOID", "TRIM"):
            move = 0.04 + 0.08 * (conviction / 100)
            risk = 0.02 + 0.03 * (conviction / 100)
            entry = round(price, 2)
            target = round(price * (1 - move), 2)
            stop = round(price * (1 + risk), 2)
            rr = round(move / risk, 2)

    signals = _build_signals(tech, sent, flow, fit, sent_data["label"])

    return {
        "ticker": ticker,
        "sector": SECTOR_MAP.get(get_sector_for_ticker(ticker), {}).get("name", ""),
        "action": action,
        "conviction": conviction,
        "net_score": round(net, 4),
        "price": price,
        "prev_close": prev_close,
        "change_pct": change_pct,
        "entry": entry,
        "target": target,
        "stop": stop,
        "risk_reward": rr,
        "components": {
            "technical": round(tech, 3),
            "sentiment": round(sent, 3),
            "flow": round(flow, 3),
            "regime_fit": round(fit, 3),
        },
        "signals": signals,
        "direction": "bullish" if net > 0 else "bearish",
    }


def _action_from_net(net: float, regime: str) -> str:
    if net >= 0.55:
        return "STRONG BUY"
    elif net >= 0.30:
        return "BUY"
    elif net >= 0.12:
        return "ACCUMULATE" if regime != "risk_off" else "DCA"
    elif net <= -0.45:
        return "SELL"
    elif net <= -0.20:
        return "TRIM"
    elif net <= -0.10:
        return "AVOID"
    return "HOLD"


def _build_signals(tech, sent, flow, fit, sent_label) -> list[str]:
    s = []
    if tech > 0.2:
        s.append("Price above 21-EMA (uptrend)")
    elif tech < -0.2:
        s.append("Price below 21-EMA (downtrend)")
    if flow > 0.2:
        s.append("Bullish institutional flow detected")
    elif flow < -0.2:
        s.append("Bearish institutional flow detected")
    if sent > 0.2:
        s.append(f"Sentiment {sent_label.lower()}")
    elif sent < -0.2:
        s.append(f"Sentiment {sent_label.lower()}")
    if fit > 0.1:
        s.append("Strong fit for current market regime")
    elif fit < -0.1:
        s.append("Headwind from current market regime")
    if not s:
        s.append("Mixed / neutral signals")
    return s


# ── Ranked opportunity lists ──────────────────────────────────────────────────

def get_top_opportunities(limit: int = 12) -> dict:
    """Return ranked buy and sell opportunities across all tickers."""
    cur = get_current_regime() or compute_regime_score()
    regime = cur["regime"]

    scored = [score_ticker(t, regime) for t in get_all_tickers()]

    buys = sorted(
        [s for s in scored if s["net_score"] > 0.05],
        key=lambda x: x["conviction"], reverse=True,
    )[:limit]
    sells = sorted(
        [s for s in scored if s["net_score"] < -0.05],
        key=lambda x: x["conviction"], reverse=True,
    )[:limit]

    # Guarantee both sides have candidates even in a one-sided tape, so the
    # options book and Shorts tab are never empty: backfill from the most
    # extreme net-score names regardless of the cutoff.
    if len(sells) < 4:
        extra = sorted(scored, key=lambda x: x["net_score"])[:6]
        seen = {s["ticker"] for s in sells}
        for e in extra:
            if e["ticker"] not in seen and e["net_score"] < 0:
                sells.append(e); seen.add(e["ticker"])
    if len(buys) < 4:
        extra = sorted(scored, key=lambda x: x["net_score"], reverse=True)[:6]
        seen = {s["ticker"] for s in buys}
        for e in extra:
            if e["ticker"] not in seen and e["net_score"] > 0:
                buys.append(e); seen.add(e["ticker"])

    return {
        "regime": regime,
        "generated_at": datetime.now().isoformat(),
        "buys": buys,
        "sells": sells,
        "total_scanned": len(scored),
    }


# ── Options ideas ─────────────────────────────────────────────────────────────

def _next_monthly_expiry(skip: int = 0) -> str:
    """Third Friday of the next monthly expiry. skip=1 returns the one after."""
    today = datetime.now()
    year, month = today.year, today.month

    def third_friday(y, m):
        d = datetime(y, m, 1)
        # weekday(): Mon=0..Sun=6; Friday=4
        offset = (4 - d.weekday()) % 7
        first_friday = d + timedelta(days=offset)
        return first_friday + timedelta(days=14)

    tf = third_friday(year, month)
    if tf.date() <= today.date():
        month += 1
        if month > 12:
            month = 1
            year += 1
        tf = third_friday(year, month)

    for _ in range(skip):
        month += 1
        if month > 12:
            month = 1
            year += 1
        tf = third_friday(year, month)

    return tf.strftime("%Y-%m-%d")


def _round_strike(price: float) -> float:
    """Round to a sensible option strike increment based on price."""
    if price >= 500:
        step = 10
    elif price >= 100:
        step = 5
    elif price >= 25:
        step = 2.5
    else:
        step = 1
    return round(round(price / step) * step, 2)


def get_options_ideas(limit: int = 24) -> dict:
    """
    Generate a balanced, rich set of options ideas — equally weighted across
    BULLISH and BEARISH setups so traders see both sides of the book.

    Bullish strategies (on BUY-side names):
      • Long Call            — ATM (high conv) or ~5% OTM (medium conv)
      • Call Debit Spread    — defined-risk leveraged upside
      • Cash-Secured Put     — income; get paid to buy lower
      • Bull Put Credit Spread — defined-risk premium collection

    Bearish strategies (on SELL-side names):
      • Long Put             — ATM (high conv) or ~5% OTM (medium conv)
      • Put Debit Spread     — defined-risk leveraged downside
      • Bear Call Credit Spread — income; fade overbought names
      • Protective Put       — hedge an existing long
    """
    opps = get_top_opportunities(limit=40)
    expiry = _next_monthly_expiry()
    far_expiry = _next_monthly_expiry(skip=1)

    # Split the per-direction budget so both sides are well represented.
    per_side = max(4, limit // 2)
    bullish_ideas = _ideas_for_side(opps["buys"], True, expiry, far_expiry, per_side)
    bearish_ideas = _ideas_for_side(opps["sells"], False, expiry, far_expiry, per_side)

    # Interleave so the grid alternates bull/bear instead of clustering.
    ideas = []
    for b, s in zip(bullish_ideas, bearish_ideas):
        ideas.append(b)
        ideas.append(s)
    # Append any remainder from the longer list.
    longer = bullish_ideas if len(bullish_ideas) > len(bearish_ideas) else bearish_ideas
    ideas.extend(longer[min(len(bullish_ideas), len(bearish_ideas)):])

    summary = {
        "bullish": len(bullish_ideas),
        "bearish": len(bearish_ideas),
        "by_strategy": {},
    }
    for i in ideas:
        summary["by_strategy"][i["strategy"]] = summary["by_strategy"].get(i["strategy"], 0) + 1

    return {
        "expiry": expiry,
        "far_expiry": far_expiry,
        "generated_at": datetime.now().isoformat(),
        "count": len(ideas),
        "summary": summary,
        "ideas": ideas,
    }


def _ideas_for_side(pool: list[dict], bullish: bool, expiry: str,
                    far_expiry: str, budget: int) -> list[dict]:
    """
    Build a diverse set of strategies for one side of the book, spread across
    as many tickers as possible. We make several passes so the grid leads with
    one idea per name before doubling up on the strongest names.
    """
    out = []
    opt_type = "CALL" if bullish else "PUT"
    pool = [o for o in sorted(pool, key=lambda x: x["conviction"], reverse=True)
            if o.get("price") and o["conviction"] >= 18]

    def _long(o):
        price, conv = o["price"], o["conviction"]
        if conv >= 55:
            return _opt_idea(o, "Long " + opt_type.title(), opt_type,
                             _round_strike(price), expiry, price, bullish,
                             "ATM — maximum directional exposure on a high-conviction signal")
        otm = price * (1.05 if bullish else 0.95)
        return _opt_idea(o, "Long " + opt_type.title(), opt_type,
                         _round_strike(otm), expiry, price, bullish,
                         "~5% OTM — leveraged play on continuation")

    def _debit(o):
        if o["conviction"] < 42:
            return None
        price = o["price"]
        long_k = _round_strike(price * (1.03 if bullish else 0.97))
        short_k = _round_strike(price * (1.12 if bullish else 0.88))
        spread = "Call Debit Spread" if bullish else "Put Debit Spread"
        return {
            "ticker": o["ticker"], "type": opt_type, "strategy": spread,
            "direction": "bullish" if bullish else "bearish",
            "strike": long_k, "short_strike": short_k,
            "expiry": far_expiry, "underlying_price": price,
            "conviction": o["conviction"], "sector": o["sector"],
            "rationale": f"Defined-risk {spread.lower()}: buy ${long_k}, sell ${short_k}. "
                         f"Caps cost and risk while keeping {('upside' if bullish else 'downside')} exposure.",
            "signals": o["signals"],
            "breakeven": round(long_k + (1 if bullish else -1) * abs(short_k - long_k) * 0.4, 2),
            "contract": f"{o['ticker']} {far_expiry} ${long_k}/${short_k} {spread}",
        }

    def _credit(o):
        if o["conviction"] < 40:
            return None
        price = o["price"]
        if bullish:
            short_k, long_k = _round_strike(price * 0.95), _round_strike(price * 0.88)
            strat = "Bull Put Credit Spread"
            rationale = (f"Sell the ${short_k} put / buy the ${long_k} put for net credit. "
                         f"Profits if {o['ticker']} holds above ${short_k}. Defined-risk income.")
        else:
            short_k, long_k = _round_strike(price * 1.05), _round_strike(price * 1.12)
            strat = "Bear Call Credit Spread"
            rationale = (f"Sell the ${short_k} call / buy the ${long_k} call for net credit. "
                         f"Profits if {o['ticker']} stays below ${short_k}. Defined-risk income.")
        return {
            "ticker": o["ticker"], "type": "PUT" if bullish else "CALL", "strategy": strat,
            "direction": "bullish" if bullish else "bearish",
            "strike": short_k, "short_strike": long_k,
            "expiry": expiry, "underlying_price": price,
            "conviction": o["conviction"], "sector": o["sector"],
            "rationale": rationale, "signals": o["signals"], "breakeven": short_k,
            "contract": f"{o['ticker']} {expiry} ${short_k}/${long_k} {strat}",
        }

    def _income_or_hedge(o):
        # Bearish hedges fire at a lower floor so the short book stays populated.
        if o["conviction"] < (32 if bullish else 20):
            return None
        price = o["price"]
        if bullish:
            csp_k = _round_strike(price * 0.95)
            return {
                "ticker": o["ticker"], "type": "PUT", "strategy": "Cash-Secured Put",
                "direction": "bullish", "strike": csp_k, "expiry": expiry,
                "underlying_price": price, "conviction": o["conviction"], "sector": o["sector"],
                "rationale": f"Sell the ${csp_k} put to collect premium and get paid to "
                             f"potentially buy {o['ticker']} ~5% lower. Bullish/neutral income play.",
                "signals": o["signals"], "breakeven": csp_k,
                "contract": f"{o['ticker']} {expiry} ${csp_k} PUT (short)",
            }
        hedge_k = _round_strike(price * 0.97)
        return {
            "ticker": o["ticker"], "type": "PUT", "strategy": "Protective Put",
            "direction": "bearish", "strike": hedge_k, "expiry": far_expiry,
            "underlying_price": price, "conviction": o["conviction"], "sector": o["sector"],
            "rationale": f"Buy the ${hedge_k} put to hedge downside / express a bearish "
                         f"lean on {o['ticker']}. Caps loss while keeping optionality.",
            "signals": o["signals"], "breakeven": round(hedge_k - price * 0.03, 2),
            "contract": f"{o['ticker']} {far_expiry} ${hedge_k} PUT (protective)",
        }

    # Per-name: emit the directional long plus the single best defined-risk /
    # income strategy that qualifies (max 2 per ticker). This keeps both ticker
    # diversity AND strategy variety instead of flooding the grid with one type.
    for o in pool:
        if len(out) >= budget:
            break
        out.append(_long(o))
        if len(out) >= budget:
            break
        # First qualifying secondary strategy: prefer defined-risk, then income.
        for builder in (_debit, _credit, _income_or_hedge):
            extra = builder(o)
            if extra:
                out.append(extra)
                break

    return out[:budget]


def _opt_idea(o, strategy, opt_type, strike, expiry, price, bullish, note):
    breakeven = strike + (1 if bullish else -1) * round(price * 0.03, 2)
    return {
        "ticker": o["ticker"], "type": opt_type, "strategy": strategy,
        "direction": "bullish" if bullish else "bearish",
        "strike": strike, "expiry": expiry, "underlying_price": price,
        "conviction": o["conviction"], "sector": o["sector"],
        "rationale": f"{note}. {_options_rationale(o, opt_type)}",
        "signals": o["signals"],
        "breakeven": breakeven,
        "contract": f"{o['ticker']} {expiry} ${strike} {opt_type}",
    }


def _options_rationale(opp: dict, opt_type: str) -> str:
    c = opp["components"]
    drivers = []
    if abs(c["flow"]) > 0.2:
        drivers.append("institutional flow")
    if abs(c["technical"]) > 0.2:
        drivers.append("trend")
    if abs(c["sentiment"]) > 0.2:
        drivers.append("sentiment")
    driver_str = ", ".join(drivers) if drivers else "composite signal"
    direction = "upside" if opt_type == "CALL" else "downside"
    return (
        f"{opp['conviction']}% conviction {direction} on {opp['ticker']} "
        f"driven by {driver_str}. {opp['action']} signal in "
        f"{opp['sector'] or 'its sector'}."
    )


# ── Per-sector heat map data ──────────────────────────────────────────────────

def get_sector_heatmap() -> dict:
    """
    Full heat-map dataset: every sector with every ticker's bias/sentiment/
    flow, plus a sector-level aggregate. Powers the heat-map view.
    """
    cur = get_current_regime() or compute_regime_score()
    regime = cur["regime"]

    sectors = []
    for key, info in SECTOR_MAP.items():
        tiles = []
        for t in info["tickers"]:
            o = score_ticker(t, regime)
            tiles.append({
                "ticker": t,
                "net_score": o["net_score"],
                "conviction": o["conviction"],
                "action": o["action"],
                "price": o["price"],
                "technical": o["components"]["technical"],
                "sentiment": o["components"]["sentiment"],
                "flow": o["components"]["flow"],
            })
        agg = sum(t["net_score"] for t in tiles) / len(tiles) if tiles else 0.0
        sectors.append({
            "sector_key": key,
            "name": info["name"],
            "layer": info["layer"],
            "desc": info["desc"],
            "aggregate": round(agg, 4),
            "tiles": sorted(tiles, key=lambda x: x["net_score"], reverse=True),
        })

    return {
        "regime": regime,
        "generated_at": datetime.now().isoformat(),
        "sectors": sectors,
    }
