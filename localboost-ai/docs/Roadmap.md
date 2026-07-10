# Roadmap

## V0 — Demo (done ✅)

Single-file, phone-first demo with simulated data. Good enough to walk into
Hollywood Liquors and do a live demo on a phone.

## V1 — Sellable pilot (30 days)

Goal: one paying pilot customer using it weekly.

| Week | Deliverable |
|---|---|
| 1 | Real data in: manual CSV upload of POS export (or Square/Clover API if the store has one). Recommendations computed from real numbers. |
| 2 | Campaign generator backed by a real LLM (Claude API) with the store's products, prices, and voice. Copy-to-clipboard → post manually. |
| 3 | Weekly SMS/email digest to the owner ("your 3 opportunities this week"). Simple login, hosted at a real URL. |
| 4 | Polish + pilot onboarding: load Hollywood Liquors' real catalog, run the live demo, close the pilot ($99–199/mo). |

**Deliberately NOT in V1:** posting directly to social APIs, Meta Ads
management, competitor scraping, multi-store dashboards, native mobile apps.
Each is a V2+ feature that only matters after someone pays.

## V2 — After first revenue

- Direct publish to Instagram/Facebook (Meta Graph API, store's own account)
- POS integrations (Square, Clover, Toast, Lightspeed)
- Customer win-back automation (opted-in SMS lists only)
- Competitor watch from public info (menus, posted prices, social activity)
- Second vertical: restaurants or barbershops — same engine, new prompts

## North-star metrics

1. Owner opens the app ≥3 mornings/week
2. ≥1 recommendation acted on per week
3. Owner can name revenue the app made them ("the BBQ bundle did $600")
