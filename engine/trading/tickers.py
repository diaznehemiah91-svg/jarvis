"""
Master Ticker Index Map — the full institutional supply-chain stack.
Each sector key maps to (display_name, [tickers], description).
"""

SECTOR_MAP = {
    # ── AI Hardware & Data Center Stack ──────────────────────────────────────
    "compute_silicon": {
        "name": "Compute Silicon",
        "layer": "AI Hardware",
        "tickers": ["NVDA", "AMD", "AVGO", "INTC"],
        "desc": "GPU/NPU compute engines powering AI workloads",
    },
    "eda_chip_design": {
        "name": "EDA & Chip Design",
        "layer": "AI Hardware",
        "tickers": ["ARM", "SNPS", "CDNS", "ANSS"],
        "desc": "Electronic design automation and IP licensing",
    },
    "mfg_equipment": {
        "name": "Manufacturing Equipment",
        "layer": "AI Hardware",
        "tickers": ["TSM", "ASML", "AMAT"],
        "desc": "Foundry and lithography equipment for advanced nodes",
    },
    "advanced_packaging": {
        "name": "Advanced Packaging (CoWoS)",
        "layer": "AI Hardware",
        "tickers": ["AMKR", "ASX", "SPIL"],
        "desc": "CoWoS/SoIC packaging for HBM and chiplet integration",
    },
    "hbm_memory": {
        "name": "HBM Memory",
        "layer": "AI Hardware",
        "tickers": ["MU"],
        "desc": "High-bandwidth memory stacked for AI accelerators",
    },
    "server_oems": {
        "name": "Server OEMs & Solutions",
        "layer": "AI Hardware",
        "tickers": ["SMCI", "DELL", "HPE", "VRT", "ETN", "MOD"],
        "desc": "Rack-scale AI servers, power delivery, and thermal management",
    },
    "networking_optics": {
        "name": "Networking & Optics",
        "layer": "AI Hardware",
        "tickers": ["ANET", "CSCO", "MRVL", "CRDO", "CIEN", "NOK"],
        "desc": "400G/800G switching, silicon photonics, and optical interconnects",
    },
    # ── Energy, Water, & Infrastructure Layer ────────────────────────────────
    "energy_utilities": {
        "name": "Energy Generation & Utilities",
        "layer": "Infrastructure",
        "tickers": ["CEG", "NEE", "GEV", "VST"],
        "desc": "Nuclear and renewable power supplying data-center load growth",
    },
    "power_thermal": {
        "name": "Power Delivery & Thermal",
        "layer": "Infrastructure",
        "tickers": ["VRT", "EMR", "NVT"],
        "desc": "UPS, liquid cooling, PDUs, and thermal management systems",
    },
    "industrial_materials": {
        "name": "Industrial Gases & Materials",
        "layer": "Infrastructure",
        "tickers": ["LIN", "FCX"],
        "desc": "Process gases for fabs and copper for power interconnects",
    },
    # ── Mega-Cap Platforms & Software ────────────────────────────────────────
    "mega_cap_tech": {
        "name": "Mega-Cap Platforms",
        "layer": "AI Software",
        "tickers": ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
        "desc": "Hyperscalers and platform giants driving AI demand",
    },
    "ai_software": {
        "name": "AI & Enterprise Software",
        "layer": "AI Software",
        "tickers": ["PLTR", "CRM", "NOW", "SNOW", "ORCL", "ADBE"],
        "desc": "Applied-AI, data, and enterprise software layer",
    },
    "ev_autonomy": {
        "name": "EV & Autonomy",
        "layer": "AI Software",
        "tickers": ["TSLA", "RIVN"],
        "desc": "Electric vehicles, robotaxi, and real-world AI",
    },
    # ── Next-Gen Frontiers ────────────────────────────────────────────────────
    "quantum": {
        "name": "Quantum Pioneers",
        "layer": "Frontier",
        "tickers": ["IONQ", "RGTI", "QBTS"],
        "desc": "Trapped-ion and superconducting qubit commercial platforms",
    },
    "space_satellite": {
        "name": "Space & Satellite Networks",
        "layer": "Frontier",
        "tickers": ["ASTS", "RDW", "RKLB"],
        "desc": "Direct-to-device satellite broadband and launch infrastructure",
    },
}

# Flat reverse lookup: ticker -> sector key
_TICKER_TO_SECTOR = {}
for _key, _info in SECTOR_MAP.items():
    for _t in _info["tickers"]:
        _TICKER_TO_SECTOR[_t] = _key


def get_all_tickers() -> list[str]:
    seen = set()
    out = []
    for info in SECTOR_MAP.values():
        for t in info["tickers"]:
            if t not in seen:
                seen.add(t)
                out.append(t)
    return out


def get_sector_for_ticker(ticker: str) -> str | None:
    return _TICKER_TO_SECTOR.get(ticker.upper())


def get_tickers_by_layer(layer: str) -> list[str]:
    out = []
    for info in SECTOR_MAP.values():
        if info["layer"] == layer:
            out.extend(info["tickers"])
    return list(dict.fromkeys(out))  # dedupe, preserve order


LAYERS = ["AI Hardware", "AI Software", "Infrastructure", "Frontier"]


# ── Whole-market symbol search ──────────────────────────────────────────────────
# Common large-cap fallbacks so search works even without a live Finnhub key.
_POPULAR = {
    "AAPL": "Apple Inc", "MSFT": "Microsoft Corp", "GOOGL": "Alphabet Inc",
    "AMZN": "Amazon.com Inc", "META": "Meta Platforms Inc", "TSLA": "Tesla Inc",
    "NVDA": "NVIDIA Corp", "AMD": "Advanced Micro Devices", "NFLX": "Netflix Inc",
    "JPM": "JPMorgan Chase", "BAC": "Bank of America", "WMT": "Walmart Inc",
    "DIS": "Walt Disney Co", "KO": "Coca-Cola Co", "PEP": "PepsiCo Inc",
    "XOM": "Exxon Mobil", "CVX": "Chevron Corp", "PFE": "Pfizer Inc",
    "INTC": "Intel Corp", "BA": "Boeing Co", "UBER": "Uber Technologies",
    "COIN": "Coinbase Global", "PLTR": "Palantir Technologies", "SOFI": "SoFi Technologies",
    "F": "Ford Motor Co", "GM": "General Motors", "T": "AT&T Inc",
    "SPY": "S&P 500 ETF", "QQQ": "Nasdaq 100 ETF", "VTI": "Total Market ETF",
}


def search_ticker(query: str, limit: int = 15) -> list[dict]:
    """
    Search the entire stock market for a symbol. Uses the live Finnhub symbol
    search when a key is configured; otherwise falls back to the curated
    watchlist plus a built-in list of popular names so search always works.
    Returns [{symbol, name, in_watchlist}, ...].
    """
    q = (query or "").strip().upper()
    if not q:
        return []

    results = []
    seen = set()

    def add(sym, name):
        sym = (sym or "").upper()
        if sym and sym not in seen:
            seen.add(sym)
            results.append({
                "symbol": sym,
                "name": name or "",
                "in_watchlist": sym in _TICKER_TO_SECTOR,
                "sector": SECTOR_MAP.get(_TICKER_TO_SECTOR.get(sym, ""), {}).get("name", ""),
            })

    # 1) Live, whole-market search via Finnhub
    try:
        from engine.trading import finnhub_client as finnhub
        if finnhub.is_configured():
            for m in (finnhub.search_symbol(q) or []):
                # Skip non-common-stock contract symbols (options, etc.)
                if m.get("type") and m["type"] not in ("Common Stock", "ETP", "ETF", ""):
                    continue
                sym = m.get("symbol", "")
                if "." in sym or ":" in sym:
                    continue
                add(sym, m.get("description"))
                if len(results) >= limit:
                    return results
    except Exception:
        pass

    # 2) Curated watchlist + popular fallbacks
    for sym in get_all_tickers():
        if q in sym:
            add(sym, _POPULAR.get(sym, ""))
    for sym, name in _POPULAR.items():
        if q in sym or q in name.upper():
            add(sym, name)

    return results[:limit]
