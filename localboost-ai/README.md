# LocalBoost AI 🚀

**An AI Growth Coach for local businesses.** The owner opens the app every
morning and gets 3–5 personalized recommendations that make them more money —
plus one-tap campaigns, a marketing calendar, and a coach they can ask anything.

Not another ad platform. An AI employee that answers the question every owner
asks: *"What should I do today to make more money?"*

## First demo: Hollywood Liquors (Boston)

A fully working, phone-first demo lives at
[`demos/hollywood-liquors/index.html`](demos/hollywood-liquors/index.html).
It's a single file with zero dependencies — open it in any browser (or send it
to your phone) and it runs on realistic simulated data.

**What it shows:**

| Tab | What the owner sees |
|---|---|
| **Today** | Marketing score, 3–5 money-making opportunities with est. revenue + confidence, store pulse tiles, weather impact, AI insight |
| **Trends** | Revenue trend chart (7/14/30 days), category movers, top sellers |
| **Campaigns** | One-tap generator: Instagram + Facebook + SMS + email, all on-theme, with copy buttons |
| **Calendar** | Every revenue holiday ahead (Thanksgiving Eve, Super Bowl, St. Patrick's…) with days-until and pre-drafted campaigns |
| **Coach** | Chat: "What should I promote today?", "Why are sales down?", "How do I raise my average sale?" |

All numbers are simulated deterministically from the calendar date, so the
demo always looks live. The `DEMO DATA` badge keeps it honest — the full
version connects to the store's POS and social accounts.

## Repo structure

```
localboost-ai/
├── docs/        Business docs — roadmap, demo playbook
├── agents/      AI agent definitions (load one, not the whole project)
├── prompts/     Reusable prompt building blocks
└── demos/       Live client demos (one folder per business)
```

## Moving this to its own repository

This folder is designed to be lifted out wholesale. Once the empty
`localboost-ai` repo exists on GitHub:

```bash
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cp -r <jarvis>/localboost-ai/* localboost-ai/
cd localboost-ai
git add -A && git commit -m "LocalBoost AI v0.1 — Hollywood Liquors demo"
git push -u origin main
```

Then delete the `localboost-ai/` folder from the jarvis repo.
