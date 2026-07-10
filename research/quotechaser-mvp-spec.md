# QuoteChaser — MVP Build & Sales Spec

**One-line thesis:** A small service business sends $15K–$40K of quotes a month, closes a third of them, and waits 60–90 days to get paid on finished work — almost entirely because nobody follows up and the owner hates chasing money from people he knows. QuoteChaser sends the quote as a link, follows up politely and automatically until it's answered, takes the deposit, invoices on completion, and chases the invoice until it's paid. Software doesn't get embarrassed. You can build v1 in 4–5 weeks directing AI coding agents — it's CRUD + scheduled messaging + Stripe, no voice AI — and sell it to the exact same owners you're already talking to about CallCatch.

This document makes decisions, not menus. Where there's a fork, the choice is made and the reasoning stated.

---

## 1. Product Spec (MVP — ruthlessly minimal)

### What v1 does

The entire product is one loop, run twice: **quote goes out as a link → automatic polite follow-ups until it's answered → accept collects a deposit → job done → invoice link → automatic reminders until it's paid → dashboard shows every dollar still sitting on the table.** Everything else is decoration.

**When the owner sends a quote (from his truck, on his phone, in under 90 seconds):**

1. He opens QuoteChaser on mobile web and fills five fields: customer name, customer cell (email optional), job description in plain English ("Regrade and re-sod back yard, remove two stumps"), **one total price** (or 2–5 free-text lines that sum — no catalog, no SKUs), and deposit required (none / 25% / 50% / custom). Quote expiry defaults to 30 days. Done.
2. QuoteChaser texts the customer **from the business's dedicated number**, in the business's name: *"Hi Sarah, it's Rodriguez Landscaping — here's your quote for the back yard project: [link]. Tap to review and approve. Questions? Just reply to this text."* Email goes out too if provided (belt and suspenders; SMS is primary — 98% open rate vs. ~20%).
3. **Follow-ups arm automatically the moment the quote is sent.** Owner does nothing. Ever. That's the product.

**What the customer experiences (no app, no login, no account):**

1. Taps the link → a clean hosted quote page: business name/logo, job description, price, expiry date, and two buttons: **Approve this quote** and **I have questions**.
2. **Approve** → types their name (typed-name click-to-accept, timestamped with IP — a legally sound acceptance record at this deal size; you do not need DocuSign for a $1,800 sod job) → if a deposit is required, straight into Stripe Checkout (Apple Pay / Google Pay / card — one tap on a phone). Quote is now **Won**, follow-ups stop instantly.
3. **I have questions** (or they just reply to the text) → the reply is forwarded to the owner's cell verbatim, **all automation on that quote pauses immediately**, and the owner is told: *"Sarah replied to the yard quote: 'Can you do it without the stumps for less?' — automation paused, reply directly or update the quote."* The human conversation stays human; the robot only talks to silence.
4. If they go quiet: polite follow-ups on **day 2, day 5, and day 10** (then stop — three touches, never more in v1). Sent via the same SMS thread (+ email), weekday business hours only, each one AI-drafted from the actual job context so it reads like the owner typed it: *"Hi Sarah, Mike from Rodriguez Landscaping — wanted to make sure the yard quote didn't get buried. Happy to walk through it or adjust anything. The link's here if you're ready: [link]."* Day-10 message adds gentle urgency tied to the real expiry: *"...I've got crew time opening up week of the 24th and the quote's good through the 30th."*
5. Every message includes reply-to-pause behavior and honors STOP instantly.

**When the job is done:**

1. Owner taps **"Job done → invoice"** on the won quote. Deposit already paid is auto-credited; the invoice is for the balance. (Standalone invoices without a prior quote: also supported, same form, same flow — half his invoices won't start as quotes in this tool at first.)
2. Customer gets the invoice text/email with a pay link → Stripe Checkout with **card and ACH bank debit both enabled** (ACH matters: 0.8% capped at $5 vs. 2.9% on a $4,000 invoice — owners care).
3. Unpaid invoice reminder ladder: **day 3, day 7, day 14, then every 7 days**, escalating in firmness but never in rudeness — from *"friendly reminder, link below"* to *"this invoice is now 3 weeks past due — here's the link, and you can pay by bank transfer to skip card fees"* — until paid or the owner marks it settled (cash/check happens; one tap: "Mark paid — cash/check").
4. Every reminder tone is pre-written and previewable; the owner sees the ladder once at setup and never thinks about it again.

**What the owner sees:**

- **SMS notifications for the moments that matter** (this buyer lives in texts, not dashboards): *quote viewed* ("Sarah just opened your $2,400 quote" — this one is addictive and drives every re-open of the app), *quote approved*, *deposit paid* 💰, *customer replied* (automation paused), *invoice paid* 💰.
- **The "Money on the Table" dashboard** — two giant numbers at the top: **"$11,400 in quotes waiting for an answer"** and **"$6,750 in unpaid invoices"**, each with an aged list underneath (sent 2 days ago / 8 days / 20 days, last action shown). One screen. This screen is the demo, the retention engine, and the reason he pays every month.
- **A Friday SMS digest:** *"This week: 6 quotes sent ($9,200), 2 approved ($3,100), $1,550 in deposits collected, $4,200 in invoices still out. QuoteChaser sent 11 follow-ups so you didn't have to."*

**What the owner configures (once, and you do it with him at onboarding):**
Business profile (~10 fields): business name, logo (optional), owner first name, owner cell for notifications/reply forwarding, default deposit %, follow-up tone (pick one of three presets: *Friendly / Neutral / Direct* — not a text editor), message signature, Stripe connection (see architecture), and default payment methods. That's it. The follow-up cadence is **fixed** in v1 (2/5/10 for quotes, 3/7/14/+7 for invoices) with only a per-item pause switch — configurable cadences are how simple products die.

### Explicit non-goals for v1 (what NOT to build, and why)

| Not building | Why it's v2+ |
|---|---|
| **QuickBooks two-way sync** | Weeks of OAuth/API/entity-mapping work, and mismatched books terrify owners. v1: **CSV export** formatted for QBO import (invoices + payments), one afternoon of work, answers the accountant question in the demo. Real one-way push to QBO is the first v2 feature — it's also a Pro-tier upsell. |
| **Line-item catalogs / price books / good-better-better options** | That's estimating software — Jobber's turf and a bottomless pit. This buyer prices jobs in his head. Free-text lines + one total captures 95% of quotes at 5% of the build. |
| **Scheduling, dispatch, job management** | Different product. QuoteChaser is deliberately "just my money" — the wedge against Jobber is *not* being a big system. The moment you add a calendar you're competing on their field. |
| **Multi-user / teams / roles** | The buyer is one owner, one phone. |
| **Recurring billing / progress payments / payment plans** | One deposit + one final invoice covers the target segment's normal job. Progress billing (30/30/40 remodels) is real but is a v2 tier feature — the state machine complexity (partials, refunds, disputes) triples. Caterers' deposit-then-balance flow already fits v1. |
| **Customer financing (Wisetack etc.)** | High-value someday; a partnership/compliance project, not an MVP feature. |
| **PDF quote builder / templates gallery** | The hosted page *is* the quote. A "Download PDF" print stylesheet on the quote page (one hour of work) handles the rare "email me a PDF" request. |
| **Native mobile app** | Mobile web + SMS links. An app store presence buys nothing at 20 customers. |
| **Automated review requests after payment** | Genuinely great cross-sell glue — v2, one sprint, easy upsell. Not now. |
| **Self-serve signup funnel** | You are the funnel. Every customer for the first 6 months is onboarded in person, same as CallCatch. |

### Core user flows

**Flow A — Owner creates and sends a quote:**
```
Owner (mobile) → New Quote: name, cell, job description, price, deposit %
→ preview the exact text the customer will get → Send
→ SMS (+ email) to customer with hosted quote link
→ follow-up sequence armed (day 2/5/10) → owner does nothing further
```

**Flow B — Customer responds… or doesn't:**
```
Customer taps link → quote page (no login)
├─ Approves → typed-name accept → Stripe Checkout deposit (if required)
│    → owner SMS "APPROVED + deposit paid 💰" → all follow-ups cancelled
├─ Replies / taps "I have questions" → automation PAUSED on this quote
│    → reply forwarded to owner's cell → humans negotiate → owner edits
│      price if needed → "resume" re-sends updated quote, re-arms sequence
└─ Silence → day 2 nudge → day 5 nudge → day 10 last touch (expiry urgency)
     → still silent → quote marked Stale on dashboard; owner sees it aging
```

**Flow C — Job done, owner invoices:**
```
Owner taps "Job done → invoice" on won quote (or creates standalone invoice)
→ deposit auto-credited, balance computed → SMS + email with pay link
→ customer pays (card / ACH / Apple Pay) → Stripe webhook marks PAID
→ owner SMS "💰 $2,650 from Sarah just hit your account" 
→ (cash/check: owner taps "Mark paid" manually)
```

**Flow D — Invoice goes unpaid:**
```
Unpaid at day 3 → friendly reminder → day 7 → firmer → day 14 → firm +
"pay by bank to skip card fees" → every 7 days thereafter
→ any customer reply pauses ladder + forwards to owner
→ dashboard shows invoice aging red at 14+ days
```

**Flow E — Owner checks the money:**
```
Friday digest SMS → taps through → Money on the Table dashboard:
[$ quotes awaiting answer] [$ invoices unpaid] + aged lists
→ any item: full message history, one-tap nudge-now / pause / void / mark paid
```

---

## 2. Technical Architecture

### The stack (decided — deliberately 90% identical to CallCatch)

| Layer | Pick | Why this one, for a solo non-engineer |
|---|---|---|
| **App + hosting** | **Next.js on Vercel** (same as CallCatch — separate repo, shared patterns) | One repo: owner app, hosted quote/invoice pages, API routes, webhook receivers. Push-to-deploy. Your AI coding agents already know this codebase shape from CallCatch — reuse the auth, SMS, and webhook scaffolding wholesale. |
| **Database + auth** | **Supabase** (Postgres) | Tables: `businesses`, `customers`, `quotes`, `invoices`, `payments`, `messages`, `scheduled_messages`, `events`. Phone-OTP login for owners (identical to CallCatch dashboard auth — copy it). RLS on, same as before. |
| **Payments** | **Stripe Connect — Standard accounts** | This is the load-bearing decision. Each business connects (or creates) **its own Stripe account** via Connect onboarding; customer payments go **directly to the owner's account**. You never touch, hold, or route funds — no money-transmitter exposure, no liability for his refund disputes, and "the money goes straight to *your* Stripe, I never see it" is a trust line in the sales pitch. Checkout Sessions on the connected account with **card + Apple/Google Pay + ACH (us_bank_account)** enabled. You add an application fee later if you ever want a payments revenue stream — the rails are already there. Do **not** use your own Stripe account and pay owners out — that's a regulated business you don't want. |
| **E-accept** | **Build it: typed name + checkbox + timestamp + IP + quote-version hash, stored in `events`** | Click-to-accept is enforceable for transactions like these (E-SIGN Act); DocuSign/Dropbox Sign integration is $$$, friction, and overkill. Show "Accepted by Sarah Miller, Jan 14 2026, 3:42 PM" on the quote page afterward — that display is what owners actually want. |
| **SMS** | **Twilio Programmable Messaging** — one local number per business | Reuse everything you learned on CallCatch. **Compliance note that will bite if ignored:** QuoteChaser's messages go to *consumers* (the owner's customers), which needs its own **A2P 10DLC campaign registration** — your CallCatch campaign use-case description doesn't cover it. Register a new campaign under the same brand day 1 (use case: "customer-initiated quote delivery and transactional payment reminders"), and run a **toll-free verified number** in parallel for pilots. STOP/HELP handling is mandatory and built in Week 2, not bolted on. |
| **Email** | **Resend** — shared sending domain (`mail.quotechaser.app`), `From: Rodriguez Landscaping via QuoteChaser`, `Reply-To:` owner's real email | Per-customer domain auth is v2. SPF/DKIM/DMARC on your domain day 1. Email is the backup channel; SMS carries the product. |
| **Follow-up scheduler** | **`scheduled_messages` table + Vercel Cron hitting `/api/cron/dispatch` every 10 minutes** | Do **not** reach for a queue/worker system (Inngest, BullMQ, temporal — all overkill). Every follow-up and reminder is a row: `send_after`, `quote_id`, `step`, `status`. The cron route claims due rows (`status='pending' AND send_after < now()`, atomic update to `sending`), renders, sends, marks `sent`. Cancelling a sequence = one UPDATE. Boring, debuggable, and your AI agent will build it correctly in one pass. |
| **Message personalization** | **Claude API** — one call at send time per follow-up, template + job context in, one SMS-length message out, temperature low, hard guardrails ("never change the price, never promise dates, never exceed 300 chars, match tone preset") | Personalization is the difference between "automated blast" and "Mike texted me." Falls back to the static template if the API call fails — a follow-up must never *not send* because an LLM hiccuped. Pennies per message. |
| **QuickBooks** | **CSV export only** (invoices + payments in QBO import format) | See non-goals. |
| **Monitoring** | **UptimeRobot** on `/api/health` + a daily self-SMS: "Yesterday: X msgs sent, Y failed, Z payments" | A silent scheduler is a dead product — you must know before the customer does. |

**Monthly COGS at typical usage** (30 quotes + 20 invoices/mo ≈ 150 SMS + 80 emails + 100 Claude calls): ~$2 Twilio + ~$0.10 Resend + ~$0.50 Claude + $0 hosting ≈ **under $5 per customer** → 93%+ gross margin at $79/mo. Stripe processing fees are paid by the *owner* on *his* money (as they would be with any processor) — not your COGS.

### System diagram

```
  OWNER (mobile web)                                CUSTOMER'S PHONE
       │ creates quote                                     ▲ ▲
       ▼                                                   │ │
 ┌──────────────────────────────────────────┐   quote SMS  │ │ follow-ups
 │        NEXT.JS APP (Vercel)              │──Twilio──────┘ │ day 2/5/10,
 │  owner app • hosted quote/invoice pages  │──Resend email──┘ inv. reminders
 │  API routes • webhook receivers          │
 └───┬────────────┬───────────────┬─────────┘
     │            │               │
     ▼            ▼               ▼
 ┌─────────┐ ┌──────────────┐ ┌─────────────────────────┐
 │SUPABASE │ │ VERCEL CRON  │ │ CLAUDE API              │
 │quotes   │ │ every 10 min │ │ drafts each follow-up   │
 │invoices │ │ dispatches   │ │ from job context        │
 │payments │ │ due rows in  │ └─────────────────────────┘
 │messages │ │ scheduled_   │
 │events   │ │ messages     │      CUSTOMER ACTIONS
 └─────────┘ └──────────────┘   ┌──────────────────────────┐
     ▲                          │ opens link → quote page   │
     │  webhooks                │ approve → e-accept        │
     │                          │ → STRIPE CHECKOUT         │
 ┌───┴──────────────────────┐   │   (owner's own connected  │
 │ STRIPE (Connect Standard)│◄──│    account: card/ACH/     │
 │ deposit + invoice pymts  │   │    Apple Pay)             │
 │ → funds land in OWNER'S  │   │ or replies to the SMS ────┼──┐
 │   account directly       │   └──────────────────────────┘  │
 └───┬──────────────────────┘                                 │
     │ payment_intent.succeeded → mark PAID, cancel ladder    │
     ▼                              Twilio inbound webhook ◄──┘
 ┌─────────────────────────────────────────────┐   │
 │ OWNER'S CELL: "💰 deposit paid" • "quote     │◄──┘ reply → PAUSE all
 │ viewed" • "Sarah replied (automation        │     automation on that
 │ paused): '...'" • Friday digest             │     quote + forward text
 └─────────────────────────────────────────────┘
        + MONEY ON THE TABLE dashboard (Next.js + Supabase)
          [$ quotes awaiting answer] [$ invoices unpaid] + aging
```

### Build sequence — how to brief your AI coding agent, week by week

Each week ends with something you can demo to yourself with two phones (yours = owner, a spare/family number = customer).

**Week 1 — "A quote exists and the customer can see it."**
- Day 1, before code: **submit the new Twilio A2P 10DLC campaign for consumer-facing messaging + toll-free verification** (longest pole, again), create Stripe account and enable Connect, Supabase + Vercel projects, domain.
- Brief the agent: *"Next.js app, Supabase schema per this spec (businesses, customers, quotes, invoices, payments, messages, scheduled_messages, events). Owner auth via Supabase phone OTP — copy the CallCatch pattern. Build: mobile-first New Quote form (5 fields + free-text lines), and the public hosted quote page at /q/[token] — unguessable token, no login, business branding, price, Approve and I-have-questions buttons (buttons can be stubs). Include /api/health."*
- *Exit criterion: you create a quote on your phone and open a clean quote page from the link on another phone.*

**Week 2 — "Send, accept, and take a deposit."**
- Brief: *"(1) Send flow: on quote send, deliver SMS via Twilio + email via Resend with the link; record in messages. (2) E-accept: typed name + checkbox → store acceptance event (name, timestamp, IP, quote hash) → quote status Won. (3) Stripe Connect Standard onboarding flow for a business; deposit payment via Checkout Session on the connected account (card + Apple Pay + ACH); handle payment_intent.succeeded webhook with signature verification and idempotency — a replayed webhook must never double-record. (4) Owner SMS notifications: viewed (pixel/first-open on the quote page), approved, deposit paid. (5) STOP/HELP handling on inbound SMS."*
- *Exit criterion: full Flow A→B happy path — you send yourself a quote, approve it, pay a $1 deposit with Apple Pay, and the owner phone buzzes twice.*

**Week 3 — "The chaser." (This week is the product)**
- Brief: *"(1) On quote send, insert scheduled_messages rows for day 2/5/10 (business-hours send windows, business's timezone, no weekends). (2) /api/cron/dispatch on Vercel Cron every 10 min: atomically claim due rows, render message via Claude API with this prompt template (context: job description, customer first name, days elapsed, expiry date, tone preset; guardrails: never alter price, ≤300 chars, plain human tone, no emoji, no exclamation-mark pileups; fallback to static template on API failure), send, mark sent. (3) Kill conditions: accept, decline, payment, manual pause, STOP — each cancels all pending rows for that quote instantly. (4) Twilio inbound webhook: any customer reply → pause automation on the matching quote + forward the text to the owner's cell + surface in the app. (5) Invoice reminder ladder day 3/7/14/+7 using the same machinery with an escalating tone table."*
- Test with time-travel: a dev endpoint that fast-forwards `send_after` so you can watch a 10-day sequence in 10 minutes.
- *Exit criterion: a quote you ignore gets three increasingly context-aware nudges; the moment you reply "can you do $1,500?" the robot goes silent and the owner phone gets your message.*

**Week 4 — "Invoices, the money dashboard, and the digest."**
- Brief: *"(1) 'Job done → invoice' conversion with deposit auto-credit; standalone invoices; hosted invoice page /i/[token] with pay link; Mark-paid-manually (cash/check). (2) Money on the Table dashboard: two headline dollar sums + aged lists, per-item detail with full message timeline and actions (nudge now, pause, void, mark paid). Mobile-first. (3) Friday digest SMS per business (cron). (4) QBO-format CSV export of invoices + payments. (5) Business profile/settings page incl. tone preset and reminder-ladder preview."*
- *Exit criterion: end-to-end Flow C→E — invoice a won quote, ignore it, watch reminders escalate, pay it, watch the dashboard number drop.*

**Week 5 — "Hardening + the demo that closes deals."**
- Failure drills: duplicate Stripe webhooks; customer pays a deposit on an **expired or voided** quote (Checkout session must be invalidated on void/expiry — test it); double-tap on Approve; owner edits price mid-sequence (must re-render pending messages or cancel/re-arm); Twilio send failure → retry then email fallback + alert-you SMS; two quotes to the same customer at once (reply routing must pick the right one — route to most-recent-active and say so in the forward).
- Build the **demo business** ("Summit Landscaping") with seeded data: a dashboard showing $14,300 on the table, plus a live-sendable demo quote. Rehearse until flawless.
- Stripe Payment Links for *your own* subscription billing ($49 pilot / $79 standard). Onboarding runbook (profile, Stripe Connect walkthrough, first real quote sent together). UptimeRobot + daily self-SMS.
- *Exit criterion: you'd bet $100 the two-phone demo works in front of a stranger.*

If anything slips, it slips into pilot week — acceptable, because pilots are white-glove anyway.

### Known hard parts — budget extra time here

1. **A2P 10DLC for consumer-facing messages (highest schedule + existential risk).** Follow-ups and payment reminders to consumers get more carrier scrutiny than CallCatch's notify-the-owner traffic. Mitigations: register the dedicated campaign day 1 with a precise description ("delivery of customer-requested quotes and transactional payment reminders for completed services; recipients initiated the business relationship"); capture consent context at quote creation ("customer provided this number when requesting the estimate" checkbox, stored); keep message copy strictly transactional — no promo language ever; STOP honored instantly and globally per business; toll-free verified fallback number for pilots. If messages silently stop delivering, the product is dead and nobody tells you — build a delivery-status webhook consumer and alert yourself on delivery-rate drops from day one.
2. **"Polite but not annoying" is the actual product.** The cadence (2/5/10, three touches, stop), the tone presets, and the reply-pause behavior deserve real iteration. Test the copy on real humans before pilots — read every message aloud in the owner's voice. One over-eager or tin-eared message and the owner turns it off forever. This is why v1 hard-caps at three quote follow-ups: restraint is a feature you can sell.
3. **Reply detection must be bulletproof.** A follow-up landing *mid-negotiation* is the product's worst possible failure ("we literally just talked and your robot texted me"). Any inbound from the customer's number pauses *everything* active for that customer (not just one quote), forwards to the owner, and requires an explicit owner action to resume. Over-pause; never under-pause.
4. **Double-charge and payment-state races.** Deposit paid while owner voids the quote; webhook retries; customer with the checkout page open in two tabs; ACH payments that "succeed" then fail 3 days later (ACH returns — handle `payment_intent.payment_failed` after apparent success and un-mark the invoice + notify the owner). Use Stripe idempotency keys everywhere, one Checkout Session per payable state, invalidate sessions on any quote/invoice mutation.
5. **Deposit math and refunds.** Deposit credited to final invoice; job cancelled after deposit (owner refunds from *his* Stripe dashboard — v1 links him there rather than building refund UI, but the dashboard must reflect refunded state via webhook); customer accidentally pays full amount at deposit stage (cap the session at deposit amount — never let free-text amounts in).
6. **Stripe Connect onboarding friction.** Half your owners have never had a Stripe account; the KYC flow (SSN/EIN, bank account) intimidates them. This is a white-glove onboarding step you do *with* them at the kitchen table, not a self-serve flow — budget 20 minutes per pilot and put it in the runbook. Payouts take ~2 business days on the default schedule; tell them upfront so the first "where's my money" text never happens.
7. **Email deliverability.** Shared sending domain means one bad actor (later, at scale) taints all. For now: strict SPF/DKIM/DMARC, transactional copy only, and treat email as the backup channel it is. Never mention "past due" in a subject line with exclamation marks unless you enjoy spam folders.
8. **Stale-state edge cases.** Customer approves an expired quote (show "this quote expired — we've let Mike know," notify owner, easy re-issue); owner does the job for a *different* negotiated price than the quote (must edit price before invoicing — make that one tap); two active quotes to one customer (see #4 in Week 5 drills).

---

## 3. Pricing & Packaging

### The anchor math (use this in every sales conversation)

A landscaper sending 25 quotes/month at a $900 average is quoting **$22,500/month**. At a 30% close rate he books $6,750. Industry follow-up data is blunt: most small operators follow up on a quote **zero or one times**, and the majority of eventually-won quotes close **after** at least one follow-up. Moving 30% → 40% — squarely what systematic follow-up does — is **+$2,250/month in booked work**. On the invoice side, cutting collection from 45+ days to under 10 isn't just cash flow; it's the difference between him floating material costs on a credit card or not. Against that, $79/month is a rounding error: **one recovered $800 quote per quarter pays for the tool; the realistic outcome is one or two per month.** Price at $79, not $29 — underpricing signals "app," and this buyer already pays $100+ to Jobber-class tools for less-focused value.

### Tiers

| | **Pilot** (first 5–10 customers only) | **Standard** | **Pro** (v2 features — sell from month 3) |
|---|---|---|---|
| **Price** | **$49/mo**, locked 6 months, month-to-month, cancel anytime, no setup fee | **$79/mo**, no setup fee | **$129/mo** |
| **Volume** | Fair use | 60 quotes + 60 invoices/mo (soft cap; nobody hits it) | Unlimited |
| **Quote links + e-accept + deposits (Stripe)** | ✅ | ✅ | ✅ |
| **Auto follow-ups (day 2/5/10), AI-personalized** | ✅ | ✅ | ✅ |
| **Invoices + escalating reminders, card + ACH** | ✅ | ✅ | ✅ |
| **Money on the Table dashboard + Friday digest** | ✅ | ✅ | ✅ |
| **Reply-pause + owner forwarding** | ✅ | ✅ | ✅ |
| **White-glove setup incl. Stripe onboarding (you, in person)** | ✅ | ✅ | ✅ |
| **CSV export (QBO format)** | ✅ | ✅ | ✅ |
| **QuickBooks one-way push (auto)** | — | — | ✅ |
| **Custom follow-up cadence + custom templates** | — | — | ✅ |
| **Progress payments (deposit + milestones)** | — | — | ✅ |
| **Post-payment review requests** | — | — | ✅ |

**Payment processing:** flows through the **owner's own Stripe account**; he pays Stripe's standard fees on his own money (2.9% + 30¢ card, 0.8% capped $5 ACH), exactly as he would with Square or anyone else. You take **no cut of payments in v1** — "I don't touch your money" is worth more as a trust line right now than 1% would be as revenue. The Connect application-fee rail is your future monetization lever once you have 50 customers; don't pull it yet.

**Reasoning:**
- **$49 pilot** — same logic as CallCatch's $99 pilot, scaled to the product: charge something real or you learn nothing, but keep it under the "sure, whatever" threshold. This product is cheaper to run and simpler to trust than CallCatch, so its pilot is cheaper.
- **$79 standard** slots exactly into the research's $59–99 window, under Jobber's useful tiers ($129+ where quote follow-up automation actually lives) and far under the value of one recovered quote. No setup fee — unlike CallCatch there's no carrier forwarding or voice tuning; onboarding is 30 minutes.
- **$129 Pro** exists to make $79 look easy and to hold QuickBooks push + custom cadences + progress payments — the three things remodelers and caterers (bigger tickets) will genuinely pay more for.

### The CallCatch bundle (decided)

**"Front Desk + Back Office" bundle: CallCatch Standard + QuoteChaser Standard = $249/mo** (vs. $278 separately — a real but modest ~10% discount; the bundle's job is narrative, not discounting). The pitch writes itself: *"CallCatch answers the call and catches the job. QuoteChaser closes the quote and collects the money. Nothing about a customer falls through a crack between their first call and your bank account."* Bundle customers get one combined Friday digest — calls caught, quotes chased, dollars collected — which is the single best retention artifact either product has. Pilot both-products deal for your very first customers: $129/mo locked 6 months. Never discount deeper than this; the ROI math doesn't need it.

---

## 4. Sales Motion (his network, face-to-face)

### Targeting within his network — and which product to lead with

Same Rolodex as CallCatch, different lead product by trade:

- **Lead with QuoteChaser:** landscapers, painters, remodelers, deck/fence builders, cleaners who bid jobs, handymen, **caterers and event companies** (deposit-driven, quote-heavy, and invoice-lag-afflicted — caterers are arguably the single best QuoteChaser fit in the whole network). These trades live and die on written estimates and get fewer emergency calls.
- **Lead with CallCatch:** plumbers, HVAC, electricians, towing/auto — emergency-call trades where the missed-call number is scarier than the quote number. QuoteChaser is their month-2 cross-sell, pitched from *their own data*: "CallCatch caught 31 calls this month; how many turned into quotes, and what happened to those quotes?"
- QuoteChaser is also your **cheaper wedge** ($49/79 vs. $99/199) for owners who balked at CallCatch — land, prove ROI in dollars collected, expand.

### Discovery script (10 minutes over coffee — surface *his* dollar number)

Ask, then shut up. Questions 1–3 are best done with his phone actually out.

1. *"Pull up the last ten quotes you sent — texts, emails, paper, whatever. How many turned into jobs?"* (He'll find 3–4 wins. **The pile of silence is the demo.**)
2. *"These ones that went quiet — what happened? Did you follow up?"* (Answer is almost always "I meant to" or "I follow up once if I remember." Do not gloat; just nod.)
3. *"Add up the quotes from the last month or two that never got an answer. Rough number?"* — **pause. Let him do the math out loud. His number, not yours.** Typically $3,000–$15,000. Write it down where he can see it.
4. *"Anybody owe you money right now for finished work? How much, and how long has it been out?"* (There is *always* something. Often shockingly old.)
5. *"When an invoice goes past two weeks — what do you actually do?"* (The honest answer is "eventually I text them, and I hate it." This question surfaces the emotional buy: chasing neighbors for money is miserable.)
6. *"If every quote you sent got three polite follow-ups without you lifting a finger, and every invoice chased itself until it was paid — what would that have been worth last month?"*
7. *"When a customer says yes to a quote, how do you lock it in? Ever had a yes evaporate before you could start?"* (Sets up the deposit feature — a verbal yes with no deposit is a maybe.)

If his questions-3-plus-4 number beats $2,000, go to the demo. If he genuinely follows up on everything and gets paid on time, he's not a buyer — ask who he knows who complains about deadbeats, and move on.

### Live demo script (10 minutes, in person — make it visceral)

Two phones: your laptop or phone is "the owner" (Summit Landscaping); **his phone is the customer.** Rehearse until boring.

1. **(1 min) Frame:** *"You're my customer. I just walked your yard and I'm sending you the quote before I'm out of the driveway."* On your phone, create the quote in front of him — his name, his cell, "$2,400 — regrade and re-sod back yard," 25% deposit — and hit Send. Point out it took under a minute.
2. **(2 min) His phone buzzes.** He reads a text from Summit Landscaping with his name and his job in it. He taps the link, sees a clean branded quote page. *"No app, no account, no PDF attachment your customer can't open."* Have him tap **Approve**, type his name, and pay the deposit — **Apple Pay, one thumb, use a $1 demo amount.** While his thumb is still on the button, **your phone buzzes: "💰 Deposit paid."** That ten-second span — his thumb to your buzz — is the sale.
3. **(2 min) The chase.** *"Now the real magic — that's for the customer who *doesn't* answer."* Show a second, seeded quote and fire the day-2 follow-up to his phone manually. He reads it. *"Would you be annoyed getting that? …Right — it reads like I typed it. It goes out on day 2, day 5, day 10, then stops. And watch —"* have him **reply** to it ("can you do it for $2,000?") — your phone buzzes with his message and *"automation paused."* *"The second a human talks, the robot shuts up and hands it to you. It only ever talks to silence."*
4. **(2 min) Money on the Table.** Open the dashboard: **$14,300 outstanding** across quotes and invoices, aged. *"This is the screen you check on Friday. Every dollar somebody owes you or hasn't answered you about, on one page."* Show the invoice ladder preview so he sees exactly how firm it gets and no firmer.
5. **(3 min) Make it his — the live close:** *"Grab your phone. Read me your last three quotes that went quiet."* Enter them, real names, real numbers, real amounts — and send the re-engagement nudges **before the meeting ends.** *"Pilot's $49 a month, I set everything up including your Stripe account right now, the money goes straight to your bank — I never touch it — and if this doesn't recover at least one dead quote or old invoice in 60 days, tell me and I'll refund every penny."* (This close works because a percentage of those three real quotes **will come back** within days — nothing you say sells like his own phone buzzing "APPROVED" on a quote he'd written off.)

### Objection handling

**"My customers will think it's weird to get automated texts."**
*"You just got three of them — which one felt automated? They come from your business, in your voice, about their actual job, and there's only ever three. Here's the flip side: the customer who got your quote and heard nothing for two weeks? That already felt weird — it felt like you didn't want the job. A polite follow-up is what good businesses do; QuoteChaser just makes sure it actually happens."*

**"I already sort of do this — I text people myself."**
*"And when you remember, it works — you close those. This is for the ones you don't remember, because you were under a deck when day 5 rolled around. You told me ten minutes ago there's [his number] sitting in quotes nobody answered. That's not a texting problem, that's a remembering problem, and you already have a full-time job. Keep texting the ones you want to text — the robot pauses the moment you or they say anything."*

**"What if it annoys a customer into not paying at all?"**
*"Three follow-ups on a quote, then it stops forever — that's fewer than your dentist sends. On invoices it's a friendly nudge that escalates slowly, and you can see every message before you ever turn it on — here's the whole ladder. And the moment a customer replies anything, everything stops and comes to you. In practice the annoying thing isn't the reminder — it's you finally calling them awkwardly at day 45. This replaces that call. Nobody's ever refused to pay because they got a payment link; people don't pay because paying is a hassle and they forgot."*

**"I already use Jobber / I do this in QuickBooks."**
*"Keep them — Jobber runs your jobs and QuickBooks keeps your books. Question: is Jobber actually texting your customer on day 5 about the quote they ignored? Is QuickBooks doing anything but emailing a PDF into a spam folder? This does one job those don't: it chases. It sits on top — quote goes out here, money comes in here, and everything exports straight into QuickBooks for your accountant. If you're on the Jobber plan that does real automated follow-up, you're paying more than this for it — most guys aren't."*

**"Won't this make me look like a big impersonal company?"**
*"It's the opposite — big companies blast; this texts like you. Your name, their job, plain words, from your number. What actually looks impersonal is silence: the customer who never heard back assumes you're too big or too busy to care. The follow-up that says 'happy to adjust anything on the yard quote' reads like a guy who wants the work. And every message that matters — a reply, a question, a negotiation — lands on your phone and gets answered by you, a human."*

**"My customers pay cash and check."**
*"Great — one tap marks it paid and the reminders stop; the dashboard still tracks who owes you what. But watch what happens when there's an Apple Pay button in the text: people pay from the couch the night they get it. You'll take more cards than you think, and getting paid tonight beats a check next week even after the card fee. Big invoice? The bank-transfer option caps the fee at five bucks."*

**"What about the card fees?"**
*"You pay Stripe exactly what you'd pay Square — I take zero on top, and the money goes straight to your account; I never touch it. And a 3% fee on money you actually collect this week beats 0% on an invoice that ages for two months."*

### How this fits the CallCatch relationship (cross-sell logic)

- **Same meeting, one story, two products:** the customer's journey is *call → quote → job → payment*. CallCatch owns the first mile, QuoteChaser owns the last. Pitch whichever end bleeds worst for that trade (see targeting above), and mention the other in one sentence, no more — sell the second product in month 2 from *their* data, not in minute 9 of the first demo.
- **CallCatch pilots are pre-qualified QuoteChaser leads:** you already read their transcripts. You literally know how many quote requests came in. The month-2 line: *"CallCatch caught 31 calls; 11 asked for estimates. Where are those 11 quotes right now?"*
- **QuoteChaser wins land you CallCatch:** owner sees $2,300 recovered, asks what else you've got. The bundle digest (calls caught + dollars collected in one Friday SMS) makes the two products feel like one system — which, per your original research, they are: *AI answers, follows up, and collects money for businesses too busy to touch a keyboard.*
- **Referrals compound across both:** a happy QuoteChaser caterer refers a plumber who needs CallCatch first. Take every intro; lead with the right end.

---

## 5. Week-by-Week Execution Checklist (7 weeks: 5 build + 2 pilot)

### Week 1 — Foundations & the visible quote
- [ ] **Day 1: submit new Twilio A2P 10DLC campaign for consumer-facing quote/payment messaging + toll-free verification fallback (longest lead item — before any code)**
- [ ] Stripe account with Connect enabled; Supabase + Vercel projects; domain; Resend with SPF/DKIM/DMARC
- [ ] Direct agent: full Supabase schema; phone-OTP owner auth (port from CallCatch); mobile New Quote form; hosted quote page `/q/[token]`; `/api/health`
- [ ] Write the follow-up copy: 3 quote templates × 3 tone presets + 4-step invoice ladder — read every one aloud in an owner's voice
- [ ] Book coffees with 3 quote-heavy owners (landscaper, painter, caterer) for Weeks 2–3 — discovery only
- [ ] If CallCatch pilots are live: pull quote-request counts from their transcripts (cross-sell ammo)

### Week 2 — Send, accept, deposit
- [ ] SMS + email quote delivery; message logging; quote-viewed tracking + owner "quote opened" SMS
- [ ] E-accept (typed name, timestamp, IP, quote hash → `events`)
- [ ] Stripe Connect Standard onboarding flow; deposit via Checkout (card + Apple Pay + ACH); webhook with signature verification + idempotency
- [ ] STOP/HELP inbound handling, global per business
- [ ] Two-phone test: send → open → approve → $1 Apple Pay deposit → two owner notifications in <30s
- [ ] Run 3 discovery coffees; write down each owner's quotes-plus-invoices outstanding dollar number

### Week 3 — The chaser engine
- [ ] `scheduled_messages` + Vercel Cron dispatcher (10-min, atomic claim, business-hours windows, business timezone)
- [ ] Claude personalization at send time with guardrails + static-template fallback
- [ ] Kill conditions wired: accept / decline / payment / pause / STOP cancel pending sends instantly
- [ ] Inbound-reply webhook: pause **all** automation for that customer, forward text to owner, surface in app; explicit resume action
- [ ] Invoice reminder ladder on same machinery (day 3/7/14/+7, escalating tone table)
- [ ] Time-travel dev endpoint; run a full 10-day sequence in 10 minutes; verify the mid-negotiation-silence case specifically
- [ ] Delivery-status webhook consumer + alert-yourself on delivery-rate drop

### Week 4 — Invoices, dashboard, digest
- [ ] Quote → invoice conversion with deposit credit; standalone invoices; `/i/[token]` pay page; mark-paid-manually (cash/check)
- [ ] ACH-return handling (`payment_failed` after apparent success → un-mark + notify owner)
- [ ] Money on the Table dashboard: two headline sums, aged lists, per-item timeline + actions (nudge now / pause / void / mark paid) — mobile-first
- [ ] Friday digest SMS; QBO-format CSV export; settings page with tone preset + ladder preview
- [ ] 3 more discovery conversations; rank 5 hottest pilot prospects (prioritize one caterer)

### Week 5 — Hardening & demo polish
- [ ] Failure drills: duplicate webhooks; pay-on-voided/expired quote; double-tap Approve; price edit mid-sequence; Twilio failure → retry → email fallback + self-alert; two active quotes, one customer
- [ ] Seed "Summit Landscaping" demo business ($14,300 dashboard, live-sendable demo quote, seeded day-2 follow-up); rehearse the two-phone demo 10× flawless
- [ ] Stripe Payment Links for your subscription billing ($49/$79); test a real charge
- [ ] Onboarding runbook: profile, Stripe Connect KYC walkthrough (~20 min), first three real quotes entered together, payout-timing expectations ("~2 business days")
- [ ] UptimeRobot + daily self-SMS; confirm 10DLC status — escalate with Twilio if stalled

### Week 6 — Pilots 1–2 live
- [ ] Demo prospect #1; close pilot #1 with Stripe link **on the spot**; state the pilot trade explicitly (locked $49, in exchange: weekly brutal feedback + testimonial + 2 intros if it works)
- [ ] Onboard in person: Stripe Connect together, load his 3–5 real stale quotes, **send the re-engagement nudges before you leave**
- [ ] Same for pilot #2 (make one of the first two a caterer or event company)
- [ ] Read every outbound message and every customer reply daily — you are QA; tune copy same-day
- [ ] The moment a dead quote comes back or an old invoice pays: screenshot it, log the dollar amount

### Week 7 — Pilots 3–5, proof, next 90 days
- [ ] Close and onboard pilots #3–5 (include at least one existing CallCatch customer via the "where are those 11 quotes" pitch — first bundle customer)
- [ ] First Friday digests go out; call each pilot after: *"anything in there you'd have collected anyway?"* — log recovered-dollar answers
- [ ] Compile the proof sheet: quotes revived, invoices collected, days-to-paid before/after, in dollars — this sheet is the sales deck for customers 6–50
- [ ] Collect first testimonial + 2 warm intros from the happiest pilot
- [ ] Decide v2 priority from pilot demand — default order: **QuickBooks one-way push → review requests → progress payments**
- [ ] Standard pricing ($79, bundle $249) for customer #6 onward; book 5 referral demos for Weeks 8–9

---

**The three decisions that matter most, restated:** (1) **Stripe Connect Standard — never touch the money.** Funds land in the owner's own account; "I never see your money" closes trust objections and keeps you out of the money-transmission business. (2) **The reply kills the robot.** Reply-pause-and-forward is the feature that makes automation feel human and defuses every "my customers will hate this" objection — over-pause, never under-pause. (3) **Restraint is the product.** Three follow-ups, fixed cadence, transactional tone, then silence — the owner is buying the confidence that the tool will never embarrass him with a neighbor, and the live-close move of loading his real stale quotes in the first meeting means the product starts paying for itself before you're out of the parking lot.
