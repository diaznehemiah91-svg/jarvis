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
        "tickers": ["ASTS", "RDW"],
        "desc": "Direct-to-device satellite broadband infrastructure",
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


LAYERS = ["AI Hardware", "Infrastructure", "Frontier"]
