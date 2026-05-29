# 🤖 Jarvis - Your Personal Desktop Voice Assistant

Jarvis is a smart and customizable desktop assistant built using **Python**, **Eel**, **HTML/CSS**, and **JavaScript**. It helps you control your PC and mobile with simple **voice** or **typed commands**.

From launching apps to making calls and chatting, Jarvis brings AI and automation to your fingertips.

---

## ✨ Features

- 🎙️ Control via **Voice & Typing**
- 📞 Make Phone Calls via Mobile (Android)
- 📲 Pickup & Disconnect Calls
- 💻 Launch Desktop Applications
- 🌐 Open Your Favorite URLs
- 📔 Built-in Phone Book
- 🙋 Store and Use Your Personal Details
- 🤖 Chat Interaction
- 🎵 Play Videos/Songs on YouTube & Spotify
- 🌤️ Check Weather Updates

---

## 🖼️ Demo

### 🔐 Face Authentication  
![Face Authentication](https://github.com/digambar2002/image-hosting/blob/main/How_to_make_Jarvis_in_Python__voice_assistant__jarvis_iron_m.gif)

### 🎤 Speech to Text Recognition  
![Speech to Text](https://github.com/digambar2002/image-hosting/blob/main/e.gif)

### 🎵 Play Music on Spotify  
![Play Music in Spotify](https://github.com/digambar2002/image-hosting/blob/main/2.gif)

---

## 🛠️ Tech Stack

- **Python** – Core logic
- **Eel** – Web-Python integration
- **HTML/CSS/JS** – Interactive frontend
- **Finnhub** – Live market data (free tier)
- **VADER** – Financial sentiment NLP

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/jarvis-python-assistant.git
cd jarvis-python-assistant
```

---

## 📈 JARVIS Command Center — Institutional Flow Tracker

A premium, voice-driven market intelligence dashboard built into JARVIS. It
tracks the entire AI/data-center supply chain — from compute silicon up through
energy, cooling, quantum, and space infrastructure — and surfaces where the
smart money is moving.

### What it does

- **REGIME engine** — scores the daily market environment
  `(Technical × 0.4) + (News × 0.4) + (Reddit × 0.2)` → Risk-On / Defensive
  Rotational / Risk-Off, each with concrete day-trading actions.
- **Sector heat maps** — 40 tickers across 12 sectors / 3 layers, color-coded
  by a composite of trend, sentiment, and flow.
- **Buy / Sell opportunities** — conviction-scored ideas with entry, target,
  stop, and risk/reward.
- **Options ideas** — call/put suggestions with strike, expiry, and rationale.
- **Institutional flow** — whale-block (dark-pool) detection, options sweeps,
  and **real insider transactions** via Finnhub.
- **Voice** — browser-native (Web Speech API): say *"show heat maps"*,
  *"options"*, *"brief me"*, or a ticker name. Click **BRIEF** for a spoken
  market summary.
- **Fast navigation** — `Ctrl/Cmd+K` command palette, number keys `1–5` to
  switch views, `V` voice, `B` brief, `R` sync.

### Data source — Finnhub (free)

JARVIS uses the **Finnhub free tier** for live data (real-time quotes, analyst
recommendations, company news, insider transactions). Without a key it runs in
a realistic **SIM mode** so the UI always works.

1. Get a free key at <https://finnhub.io/register>
2. Paste it into `engine/config.py`:
   ```python
   FINNHUB_KEY = "your_key_here"
   ```
   …or set the `FINNHUB_API_KEY` environment variable.
3. The badge in the top bar flips from **SIM MODE** to **LIVE · FINNHUB**.

*(Gemini / LLM support is wired via `LLM_KEY` for when you're ready to add it.)*

### Run it

```bash
pip install -r requirements.txt          # plus: flask yfinance vaderSentiment requests
python jarvis_boot.py                     # starts backend + opens Chrome app window
```

Then open **<http://localhost:8765/command/>** (the boot launcher does this
automatically in a clean Chrome application window).

### Make it your daily startup page (Windows)

- **Auto-launch at boot:** double-click **`install_autostart.bat`** once. JARVIS
  will start with Windows and open the Command Center in a chromeless app window.
  (To undo: `Win+R` → `shell:startup` → delete `JARVIS.lnk`.)
- **Set as Chrome homepage:** Chrome → Settings → *On startup* → *Open a
  specific page* → add `http://localhost:8765/command/`.

> The dashboard is also reachable from the classic JARVIS UI via the
> chart icon, and the lighter legacy tracker lives at `/trading/`.

---

<details>
<summary>Classic JARVIS assistant setup</summary>

```bash
cd jarvis-python-assistant
pip install -r requirements.txt
python run.py
```

The classic assistant adds voice trading commands too: say *"market regime"*,
*"flow scan"*, *"sector sentiment"*, or *"refresh market data"*.

</details>
