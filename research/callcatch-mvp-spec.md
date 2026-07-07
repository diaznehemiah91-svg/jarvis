# CallCatch — MVP Build & Sales Spec

**One-line thesis:** Every missed call at a 1–10 person home-service business is a $150–$3,000 job that goes to whoever answers. CallCatch answers every call, captures the job, and texts it to the owner in under 60 seconds. You can build v1 in 5–6 weeks by directing AI coding agents, and sell it face-to-face to service-business owners you already know.

This document makes decisions, not menus. Where there's a fork, the choice is made and the reasoning stated.

---

## 1. Product Spec (MVP — ruthlessly minimal)

### What v1 does

The entire product is one loop: **call comes in → AI answers → lead captured → owner notified → caller gets a text confirmation.** Everything else is decoration.

**When a call comes in (24/7, same behavior day or night for v1):**

1. AI answers within 2 rings with a business-branded greeting: *"Thanks for calling Rodriguez Plumbing, this is the automated assistant — I can get you on the schedule or take your info for Mike. Who am I speaking with?"* It discloses it's an assistant (builds trust, and several states require consent/disclosure norms around recorded automated calls — keep it in).
2. It collects, conversationally, the five fields that matter:
   - Name
   - Callback number (confirmed digit-by-digit if it differs from caller ID)
   - Service address / neighborhood
   - What's wrong (free-text problem description: "water heater leaking in garage")
   - Urgency: **emergency now** vs. **soon this week** vs. **quote/estimate request**
3. It answers a small set of FAQs from the business profile: service area, hours, rough pricing posture ("Mike gives free estimates; most drain jobs start around $150"), licensed/insured, payment types. If asked anything outside the profile: *"That's a great question for Mike directly — I'll make sure he calls you back within the hour."* **The AI never invents prices, never promises arrival times, never diagnoses.**
4. **Emergency path:** if the caller indicates an active emergency (burst pipe, no heat in winter, flooding), the AI says it's flagging this as urgent, and the system (a) sends the owner an SMS prefixed 🚨 EMERGENCY, (b) immediately attempts a **live call transfer** to the owner's cell. If the owner doesn't pick up in 20 seconds, the AI tells the caller: *"Mike's on a job — he'll call you back within 15 minutes. If this is life-threatening, call 911."* This warm-transfer-with-fallback is the single most important trust feature for this buyer.
5. Call ends. Within 60 seconds:
   - **Owner receives an SMS**: `New lead via CallCatch: Maria G, 555-0142, 42 Elm St. Water heater leaking in garage. Wants someone TODAY. Tap to hear: [link]` — plus an email with the full transcript and audio link.
   - **Caller receives an SMS**: `Thanks for calling Rodriguez Plumbing! Mike got your info and will call you back shortly. — Rodriguez Plumbing` (keeps the caller from immediately dialing the next plumber on Google — this text measurably reduces leakage to competitors).

**Deployment model (critical decision):** CallCatch does **not** replace the business's phone number. It sits behind **conditional call forwarding** — the owner's existing number forwards to the CallCatch number only when *busy, unanswered after ~20 seconds, or unreachable*. Owner answers when he can; CallCatch catches everything else. This makes onboarding a 5-minute carrier setting (`*71` / `*004*` codes on most US carriers), makes the pitch "safety net, not replacement," and means zero porting risk. Full-forwarding after hours is a one-tap owner behavior, not a product feature.

**What the owner sees:**
- SMS + email per call (the primary interface — these owners live in their texts, not in dashboards)
- A dead-simple web dashboard (log in with phone number + code): reverse-chronological call log with caller, number, summary, urgency tag, audio player, transcript, and a running counter at the top: **"CallCatch answered 27 calls this month. 9 were after-hours or while you were busy."** That counter is your retention engine — it's the invoice justifying itself.

**What the owner configures (once, and you do it for them during pilot onboarding):**
A single settings page — the "Business Profile" — with ~12 fields: business name, trade, greeting name, service area (list of towns/zips), hours, owner cell for notifications and emergency transfer, emergency keywords relevant to the trade, FAQ answers (5–8 Q&A pairs), pricing posture text, and the SMS signature. This profile compiles into the voice agent's prompt. Nothing else.

### Explicit non-goals for v1 (what NOT to build, and why)

| Not building | Why it's v2+ |
|---|---|
| **Self-serve appointment booking on a calendar** | Doubles failure modes (double-booking, wrong job durations, drive time). Home-service scheduling is genuinely hard — owners triage jobs themselves. v1 captures the lead; owner books it in 5 minutes with full context. Add Google Calendar "offer 2 time windows" as a per-customer toggle in v2 once trust exists. |
| **Jobber / Housecall Pro / ServiceTitan integrations** | Each is weeks of API work for a feature that matters only after you have 15+ customers who all use the same tool. v1 answer: SMS + email land the lead anywhere. v2: Zapier webhook (one afternoon) covers 80% of integration asks. |
| **Outbound calls / follow-up campaigns / review requests** | Different product, different compliance surface (TCPA outbound rules are much stricter). Inbound-only keeps you clean. |
| **Multi-location, multi-user, roles/permissions** | Your buyer is one owner, one cell phone. |
| **Spanish (bilingual) agent** | Genuinely valuable in this market and technically easy on modern voice platforms — but it doubles your prompt-testing surface. Make it the headline feature of the Pro tier in v2, not a v1 risk. |
| **Self-serve signup / free trial funnel** | You are the funnel. Every customer for the first 6 months is onboarded by you in person. Building signup flows now is procrastination disguised as work. |
| **Custom voice cloning of the owner** | Creepy-adjacent, adds latency, and the disclosure requirement kills the point. Pick one great stock voice (warm, mid-30s, slight regional neutrality) and one alternate. |
| **Analytics beyond the call counter** | The counter *is* the analytics. |

### Core user flows

**Flow A — Customer calls in:**
```
Caller dials business number → owner busy/no answer after 20s
→ carrier forwards to CallCatch number → AI answers (< 2 rings)
→ greeting + disclosure → collects name/number/address/problem/urgency
→ [if emergency: attempt live transfer to owner cell → fallback promise]
→ answers profile FAQs if asked → confirms details back → ends call
→ caller gets confirmation SMS within 60s
```

**Flow B — Owner receives the result:**
```
Call ends → transcript + recording processed → LLM extracts structured lead
(name, number, address, problem, urgency, best callback window)
→ SMS to owner cell (emergency-flagged if applicable) + email with transcript/audio
→ lead appears in dashboard call log
→ owner calls customer back with full context ("Hi Maria, heard about the
   water heater — I can be there at 3")
```

**Flow C — Owner configures the business (you drive this in pilots):**
```
You sit with owner (20 min) → fill Business Profile form together
→ profile compiles to agent prompt → you call the number together and test
3 scenarios (normal lead, FAQ, fake emergency) → tweak greeting wording
→ set conditional forwarding on owner's phone (*71 code, 2 minutes)
→ done; owner changes nothing day-to-day
```

---

## 2. Technical Architecture

### The stack (decided)

| Layer | Pick | Why this one, for a solo non-engineer |
|---|---|---|
| **Voice agent platform** | **Retell AI** | This is the load-bearing decision. Retell gives you: agent building in a dashboard (prompt + conversation flow, no code), phone numbers purchasable inside the platform (skip raw Twilio provisioning for voice), built-in turn-taking/interruption handling ("barge-in") and background-noise robustness that would take months to hand-roll, warm transfer support, per-call webhooks with transcript + recording + structured post-call analysis, and transparent usage pricing (≈$0.07–$0.15/min all-in depending on voice/LLM — a 2-minute call costs ~$0.25). Alternative is Vapi (more developer-flexible, slightly more assembly required). **Do not** build on raw Twilio Media Streams + your own STT/TTS/LLM pipeline — that's a 6-month latency-engineering project you don't need. |
| **In-call LLM** | Fast model selected inside Retell (Claude Haiku 4.5 or equivalent fast tier) | Voice needs sub-second first-token latency. You configure this with a dropdown in Retell, not code. |
| **Post-call extraction LLM** | **Claude API** (one `messages` call per completed call) | Takes the transcript, returns strict JSON (name, phone, address, problem, urgency, callback window) via structured outputs. Pennies per call, and it's the one place LLM quality touches your data model, so use a strong model here — latency doesn't matter post-call. |
| **SMS** | **Twilio Programmable Messaging** | Boring, reliable, best docs, and every AI coding agent knows it cold. **Compliance path:** buy a **toll-free number and submit toll-free verification in Week 1** (approval in days, works for pilots) *and* start **A2P 10DLC brand/campaign registration in Week 1 in parallel** (takes 1–3+ weeks; it's the long-term local-number path). Do not skip this — unregistered SMS gets filtered and your core notification silently dies. |
| **Database + auth** | **Supabase** (Postgres) | Tables: `businesses`, `calls`, `leads`, `events`. Row-level security out of the box, magic-link/OTP phone auth for the owner dashboard, generous free tier, and Claude Code works with it fluently (MCP integration exists). |
| **App + hosting** | **Next.js on Vercel** | One repo: marketing page, owner dashboard, API routes (webhook receivers). Push-to-deploy, free tier covers you past 50 customers. |
| **Calendar** | **None in v1.** v2: Google Calendar API free/busy + tentative events, exposed to the agent as a Retell tool call | See non-goals. |
| **Payments** | **Stripe Payment Links + Customer Portal** | No billing code at all in v1. Create two Payment Links ($99 pilot, $199 standard), text the link to the owner after the handshake, Stripe handles cards/receipts/dunning. Move to metered/tiered billing only when someone's usage forces it. |
| **Email** | **Resend** | Transcript emails in 20 lines of code. |
| **Monitoring** | **UptimeRobot** (free) pinging your webhook health endpoint + a daily "yesterday's calls" summary SMS to *you* | You must know before the customer does when calls stop flowing. |

**Monthly COGS at typical usage** (150 calls × 2 min avg): ~$40–50 Retell + ~$2 Twilio SMS + ~$1 Claude + $0 hosting ≈ **$45–55 per customer** → ~75% gross margin at $199/mo. Sanity-checked; works.

### System diagram

```
                        CUSTOMER'S PHONE
                              │ dials business's real number
                              ▼
                  OWNER'S EXISTING PHONE LINE
                   (busy / no answer 20s / off)
                              │ carrier conditional forwarding (*71)
                              ▼
                 ┌─────────────────────────────┐
                 │   RETELL AI  (voice layer)  │
                 │  phone number • STT • fast  │
                 │  LLM turn loop • TTS •      │
                 │  interruption handling      │
                 │  • warm transfer attempt ───┼──► OWNER'S CELL (emergencies)
                 └──────────────┬──────────────┘
                                │ call_ended webhook
                                │ (transcript, recording URL, metadata)
                                ▼
                 ┌─────────────────────────────┐
                 │  NEXT.JS API ROUTE (Vercel) │
                 │  1. verify webhook          │
                 │  2. Claude API → strict-JSON │
                 │     lead extraction          │
                 │  3. write to Supabase        │
                 │  4. fire notifications       │
                 └───────┬──────────┬──────────┘
                         │          │
              Twilio SMS │          │ Resend email
                         ▼          ▼
        ┌────────────────────┐   ┌─────────────────────┐
        │ OWNER: lead SMS    │   │ OWNER: transcript + │
        │ (🚨 if emergency)  │   │ audio link email    │
        └────────────────────┘   └─────────────────────┘
                         │
              Twilio SMS ▼
        ┌────────────────────────────┐        ┌──────────────────────┐
        │ CALLER: "Mike got your     │        │ OWNER DASHBOARD      │
        │ info, he'll call shortly"  │        │ (Next.js + Supabase) │
        └────────────────────────────┘        │ call log • audio •   │
                                              │ monthly counter      │
                                              └──────────────────────┘
```

### Build sequence — how to brief your AI coding agent, week by week

Phase it like a contractor engagement: each week ends with something you can *demo to yourself by phone*.

**Week 1 — "The phone answers." (No code yet — platform config)**
- Create Retell account; build the agent in the dashboard: system prompt for a generic plumbing company, pick voice, buy a number.
- Call it 30 times yourself. Mumble. Interrupt it. Give a fake emergency. Talk with the TV on. Tune the prompt until the intake flow feels human.
- Start Twilio: buy toll-free number, submit toll-free verification, **and** begin A2P 10DLC brand registration today (it's the longest pole).
- Register domain, set up Supabase project, Vercel project, Stripe account.
- *Exit criterion: you can call a number and have a decent AI intake conversation.*

**Week 2 — "The call becomes a text." (First real code)**
- Brief the agent: *"Build a Next.js app with one API route that receives Retell's `call_ended` webhook, verifies the signature, sends the transcript to the Claude API with this JSON schema for lead extraction, writes business/call/lead rows to Supabase (here's the schema), and sends two Twilio SMS (owner notification, caller confirmation) plus a Resend email. Include a health endpoint."*
- Wire your Week-1 agent to it. End-to-end test: call → SMS arrives on your phone in under 60s.
- *Exit criterion: the full Flow A→B loop works for one hardcoded business.*

**Week 3 — "Multi-business + the profile compiler."**
- Brief: *"Add a `businesses` table with these ~12 profile fields. Write a function that compiles a business profile into the Retell agent prompt (template with slots) and updates the agent via Retell's API. Each business gets its own Retell number mapped in the DB. Build a minimal internal admin page where I can create/edit a business profile and hit 'Deploy agent.'"*
- Create a second fake business (HVAC) and verify both numbers behave per their profiles.
- *Exit criterion: you can spin up a new customer in under 15 minutes from the admin page.*

**Week 4 — "Emergency transfer + owner dashboard."**
- Brief part 1: configure Retell warm transfer — emergency detected → attempt transfer to owner cell → on no-answer, fallback script; webhook marks the lead 🚨.
- Brief part 2: *"Build the owner dashboard: phone-OTP login (Supabase auth), call log list with urgency badges, transcript view, audio playback, and the monthly answered-calls counter. Mobile-first — owners will open this from the SMS link on a phone."*
- *Exit criterion: fake emergency call rings your cell mid-call; dashboard shows everything.*

**Week 5 — "Hardening + demo polish." (Budget week — see hard parts)**
- Failure drills: Retell webhook retries, Twilio send failures (fall back to email + alert you), duplicate webhook idempotency, voicemail-detection edge (what happens when a *robocall* hits your line — add a spam/short-call filter so owners don't get junk SMS).
- Build **your demo business**: a polished profile for a fictional "Summit Plumbing & Drain," tuned until the demo call is flawless. This profile is a sales asset — treat it like one.
- Set up UptimeRobot + your daily summary SMS. Create Stripe Payment Links.
- *Exit criterion: you'd bet $100 the demo works in front of a stranger.*

**Week 6 — "First real customer." (Buffer + onboarding tooling)**
- Whatever slipped, lands here — something will (usually 10DLC or transfer edge cases).
- Write your one-page onboarding runbook (profile questions, carrier forwarding codes per major carrier, the 3 test calls).
- Onboard pilot customer #1 in person.
- *Exit criterion: a real business's real overflow calls are flowing through CallCatch.*

Weeks 7–8 are sales weeks (Section 5).

### Known hard parts — budget extra time here

1. **A2P 10DLC / SMS compliance (highest schedule risk).** Registration reviews can take weeks and rejections are common for vague use-case descriptions. Mitigation: toll-free verified number for pilots (days), 10DLC in parallel from day 1, and write the campaign description precisely ("transactional lead notifications to business owner who is our direct customer; one confirmation SMS to inbound caller who initiated contact by phone"). Include opt-out handling (STOP) even for transactional traffic.
2. **Voice-agent latency and interruptions.** Retell handles the plumbing, but *your prompt* determines conversational quality. Long prompt → slow, rambling agent. Keep the system prompt tight (< ~1,500 words), instruct short responses ("one question at a time, max two sentences"), and test barge-in (caller interrupting mid-sentence) explicitly. Budget 2–3 full days of just calling the thing.
3. **Names, addresses, and phone numbers over audio.** STT mangles "Kowalczyk" and "42 Bierstadt Ct." Mitigate in-prompt: always read the callback number back digit-by-digit for confirmation; for addresses, capture *approximately* and let the owner confirm on callback — don't grind the call to a halt spelling things. Caller ID covers the phone number 90% of the time.
4. **Emergency transfer edge cases.** Owner's phone goes to voicemail → transfer "succeeds" into voicemail and the caller is stranded. Test this exact case; configure transfer timeout ~20s with the AI reclaiming the call. This is Week 4's dragon.
5. **Background noise / trucks / job sites / mumbling.** Callers to plumbers are standing next to running water. Retell's STT is decent, but instruct the agent to confirm rather than guess ("I want to make sure I got that — leaking water heater, right?"). One confirmation loop max, then move on.
6. **Robocalls and spam hitting the AI.** Forwarded lines get junk. Add a cheap filter: calls under 10 seconds or matching spam patterns don't generate owner SMS. Owners will churn if you text them garbage at 2 a.m.
7. **Conditional forwarding setup variance.** Carrier codes differ (Verizon `*71`, AT&T `*004*` variants, T-Mobile via app, VoIP systems via portal). Since *you* do pilot onboarding in person, this is a runbook problem, not a product problem — but build the runbook.

---

## 3. Pricing & Packaging

### The anchor math (use this in every sales conversation)

An average plumbing/HVAC job runs $150–$450; a water heater replacement $1,500–$3,000; a new HVAC system $5,000+. Industry data consistently shows small home-service businesses miss 25–40% of inbound calls, and ~80% of callers who hit voicemail don't leave a message — they call the next result on Google. If CallCatch converts **one** otherwise-lost job per month, it pays for itself 2–10×. Price accordingly — this is a $199 product, not a $49 product. Underpricing signals "toy."

### Tiers

| | **Pilot** (first 5–10 customers only) | **Standard** | **Pro** (v2 features — sell it from month 3) |
|---|---|---|---|
| **Price** | **$99/mo**, locked for 6 months, no setup fee, cancel anytime, month-to-month | **$199/mo** + $250 one-time setup (waivable on annual) | **$349/mo** + $250 setup |
| **Calls included** | Fair use (~200 calls/mo) | 250 calls/mo, then $0.50/call | 500 calls/mo, then $0.40/call |
| **24/7 AI answering + lead capture** | ✅ | ✅ | ✅ |
| **Instant owner SMS + email + dashboard** | ✅ | ✅ | ✅ |
| **Caller confirmation SMS** | ✅ | ✅ | ✅ |
| **Emergency live transfer** | ✅ | ✅ | ✅ |
| **White-glove onboarding (you, in person)** | ✅ | ✅ | ✅ |
| **Appointment booking (Google Calendar)** | — | — | ✅ |
| **Bilingual English/Spanish agent** | — | — | ✅ |
| **Zapier / Jobber lead push** | — | — | ✅ |
| **Multiple numbers / second line** | — | — | ✅ |

**Reasoning:**
- **$99 pilot** exists to remove all friction from people who know you personally, while still charging *something* — free pilots produce polite non-users and zero learning. $99 is under the "I'll try it without thinking" threshold for a business owner but high enough that they'll actually forward their line.
- **$199 standard** sits far below a human answering service ($1.20–$2.50/min, easily $400–$900/mo for this call volume) and far below one lost water-heater job. Competitive AI answering products cluster $150–$400/mo; $199 with in-person onboarding is aggressive but credible.
- **$349 Pro** exists mostly to make $199 look reasonable, and to have somewhere to put booking + Spanish, which are the two most-requested v2 features in this segment. Spanish alone closes deals in most metro markets.
- **Per-call overage, not per-minute** — owners understand "calls," not "minutes," and your ~2-min average call cost (~$0.25) leaves huge margin at $0.40–0.50.

---

## 4. Sales Motion (his network, face-to-face)

### Targeting within his network

First 10 conversations: plumbers, HVAC, electricians, handymen, landscapers, cleaners, auto repair — **prioritize trades with emergency calls** (plumbing, HVAC, electrical, towing-adjacent auto) because their missed-call pain is acute and their job values are highest. Restaurant/salon/retail friends are *referral sources*, not v1 customers ("who does your plumbing at the restaurant?") — their call patterns (reservations, appointments) fit a later product.

### Discovery script (10 minutes, over coffee — surface *their* dollar number)

Ask, then shut up:

1. *"When you're under a sink on a job and your phone rings — what happens to that call?"*
2. *"How many calls a day would you guess you can't pick up? What about evenings and weekends?"*
3. *"When someone gets your voicemail, do they usually leave a message?"* (They'll say no. Everyone says no.)
4. *"What's an average job worth to you? What's a big one — water heater, panel upgrade, full system?"*
5. *"So if even two of those missed calls a week were real jobs… what's that a month?"* — **pause. Let him do the math out loud. His number, not yours.** This is the whole script. Typical answer lands between $1,500 and $8,000/month.
6. *"Have you ever tried an answering service? What'd you hate about it?"* (Cost, scripts read by people who don't know the trade, messages that arrive hours later.)
7. *"Who calls you back faster — you, or the other guy the customer dials after your voicemail?"*

If his self-computed number exceeds $1,000/month, go straight to the demo. If he shrugs at every question, he's not a buyer — ask who he knows who complains about missed calls, and move on.

### Live demo script (10 minutes, in person — make it visceral)

The demo is theater. Rehearse it until it's boring for you.

1. **(1 min) Frame it:** *"I'm going to have you call a plumbing company. It's not real — it's my software. Just call and pretend your water heater's leaking."* Hand him a card with the number. **He dials from his own phone.** Him dialing matters — it's not a canned video.
2. **(3 min) He talks to it.** Your demo agent ("Summit Plumbing & Drain") answers in 2 rings, handles his mumbling, asks the right trade-specific questions, confirms his number. Say nothing while he's on the call. Watch his face at the moment it handles his interruption — that's when they get it.
3. **(1 min) The payoff:** *before he's put his phone down*, **your** phone buzzes. Show him the SMS: his name, his number, "leaking water heater," URGENT. Then his phone buzzes — the confirmation text. *"That text is what stops your customer from calling the next plumber on Google."*
4. **(2 min) The emergency:** *"Call again — this time say water's flooding your basement right now."* Mid-call, your phone **rings** — the live transfer. Answer it: "This is Mike." Hang up, show the 🚨 SMS. *"That's a 2 a.m. burst pipe reaching you in 30 seconds, and if you don't pick up, the customer still gets a promise and you still get the lead."*
5. **(2 min) Make it his:** open the profile form on your laptop. *"Now watch."* Change the greeting to **his** business name, his service area, redeploy (Week 3 built this to be fast), and have him call again — it answers as *his company*. Close: *"Pilot's $99 a month, I set everything up personally right now, your number doesn't change, calls only come to us when you can't answer, and you can shut it off with one carrier code. If it doesn't catch you at least one job in the first month, tell me and I'll refund it."*

### Objection handling

**"I don't want a robot talking to my customers."**
*"Neither do I — that's why it only answers the calls that were going to voicemail. Right now the choice isn't robot vs. you. It's robot vs. silence, and silence is the other plumber's phone ringing. You just talked to it — did it feel like a phone tree, or did it feel like a decent receptionist?"* (The demo pre-answers this; if they still resist, offer after-hours-only forwarding as the starting configuration.)

**"What if it messes up an emergency call?"**
*"Emergencies are the one thing it's not allowed to handle alone — it rings your cell live, while the customer's still on the line. You saw it. And if you can't pick up, today that customer gets voicemail and calls someone else; with this they get a callback promise, you get their address and problem in 30 seconds, and the whole call is recorded so you can hear exactly what they said. It's strictly safer than what happens now."*

**"I already have Jobber / Housecall Pro."**
*"Keep it — that's your job management, this is your phone. Jobber doesn't answer a call at 9 p.m. while you're at your kid's game. CallCatch catches the lead and texts it to you; you drop it into Jobber in ten seconds. Direct push into Jobber is on my list — pilot customers get it first when it ships."*

**"My customers won't like it / they're older / they want a real person."**
*"Some will always prefer a person — and when you're free, they still get one: you. This only takes the calls nobody was taking. And here's the thing about your older customers: they're exactly the ones who won't leave a voicemail and won't text you — but they will talk to a polite voice that picks up on the second ring. Give me 30 days and read your own transcripts; you'll hear how your customers actually react."*

**"What does it cost me if it doesn't work?"**
*"$99, and I'll refund that if it doesn't hand you at least one real lead in the first month. No contract, no setup fee, your number never changes, and turning it off is one code on your phone — you don't even need me. The real risk isn't the $99. It's the two calls you'll miss this weekend."*

*(Bonus — you'll hear it: "Can't I just do this with my voicemail / an answering machine?")* — *"80% of callers won't leave a message. Voicemail is where jobs go to die. This picks up."*

### Structure of the first 5 pilot deals

- **Terms:** $99/mo, locked 6 months, month-to-month, cancel anytime, no setup fee, first-month money-back if no lead captured. Payment by Stripe link *on the spot* (a signed-up pilot who "will pay later" is not a pilot).
- **The trade, stated explicitly:** *"You're getting half price forever on this tier because you're a pilot. In exchange I need three things: brutal feedback weekly, permission to fix things fast (there will be rough edges), and — if it works — a Google review and two introductions."* Get the testimonial/referral agreement upfront, when gratitude is highest.
- **What you personally do at onboarding (in person, ~45 min):** fill the profile together; set carrier forwarding on his phone yourself; run the 3 test calls (normal, FAQ, fake emergency) with him watching; save your cell in his phone as "CallCatch Nick — call me if anything's weird."
- **What you do for the following 2 weeks:** read *every* transcript within 12 hours (you're QA), fix prompt issues same-day, and send him a Friday SMS: *"CallCatch caught 11 calls this week — 4 after hours. The Tuesday 8pm one sounded like a real water heater job, did you win it?"* That Friday text does three jobs: retention, testimonial ammunition, and your conversion data.
- **Success metric per pilot:** ≥1 owner-confirmed "job I would have missed" within 30 days. Log the dollar value. Five pilots × real dollar numbers = your entire sales deck for customers 6–50.

---

## 5. Week-by-Week Execution Checklist (8 weeks)

### Week 1 — Foundations & the talking demo
- [ ] Create accounts: Retell AI, Twilio, Supabase, Vercel, Stripe, Resend; register domain
- [ ] **Submit Twilio toll-free verification AND start A2P 10DLC brand/campaign registration (longest lead time in the project — do this before anything else today)**
- [ ] Build first Retell agent in dashboard: plumbing intake prompt, voice selection, buy number
- [ ] Make 30+ test calls: interruptions, mumbling, background noise, fake emergency; tune prompt
- [ ] Write the lead-extraction JSON schema (name, phone, address, problem, urgency, callback window)
- [ ] Book coffee with 3 service-business owners from your network for Weeks 2–3 (discovery only — no pitch yet)

### Week 2 — Call → text pipeline
- [ ] Direct AI agent: Next.js app + webhook route (verify Retell signature → Claude extraction → Supabase write → Twilio owner SMS + caller SMS → Resend email)
- [ ] Supabase schema live: `businesses`, `calls`, `leads`, `events`
- [ ] End-to-end test: call the number → owner SMS on your phone in < 60 seconds
- [ ] Add idempotency (duplicate webhooks) and a `/health` endpoint
- [ ] Run 3 discovery coffees; write down each owner's self-computed missed-call dollar number

### Week 3 — Multi-business engine
- [ ] Profile-to-prompt compiler + Retell agent deploy via API
- [ ] Internal admin page: create/edit business, deploy agent, assign number
- [ ] Second fake business (HVAC) live; verify both numbers behave per profile
- [ ] Timed drill: new business from zero to answering calls in < 15 minutes
- [ ] 3 more discovery conversations; rank your 5 hottest pilot prospects

### Week 4 — Emergencies & owner dashboard
- [ ] Configure warm transfer: emergency → ring owner cell (20s timeout) → AI fallback script
- [ ] Test the voicemail-trap case (owner's cell goes to voicemail mid-transfer) and fix it
- [ ] Owner dashboard: phone-OTP login, call log, urgency badges, transcript, audio, monthly counter (mobile-first)
- [ ] 🚨 SMS formatting for emergency leads
- [ ] Spam/short-call filter so junk calls don't SMS the owner

### Week 5 — Hardening & demo polish
- [ ] Failure drills: Twilio send failure → email fallback + alert-you SMS; Retell webhook retry handling
- [ ] Build and rehearse the "Summit Plumbing & Drain" demo profile until 10/10 demo calls are flawless
- [ ] UptimeRobot on `/health` + daily summary SMS to yourself
- [ ] Stripe Payment Links created ($99 pilot, $199 standard); test a real charge
- [ ] Write the onboarding runbook (profile questions, carrier forwarding codes: Verizon/AT&T/T-Mobile/VoIP, 3 test-call script)
- [ ] Confirm 10DLC / toll-free verification status; escalate with Twilio support if stalled

### Week 6 — First pilot live
- [ ] Buffer: land whatever slipped from Weeks 4–5
- [ ] Run the full 10-minute demo for your #1 prospect; close pilot #1 with Stripe link on the spot
- [ ] Onboard pilot #1 in person: profile, forwarding, 3 test calls, save your number in his phone
- [ ] Read every pilot transcript daily; fix prompt issues same-day
- [ ] Send pilot #1 the Friday "calls caught this week" SMS

### Week 7 — Pilots 2–4
- [ ] Demo + close pilots #2 and #3 (aim for one emergency-heavy trade: plumbing or HVAC)
- [ ] Onboard both in person using the runbook; note every friction point and fix the runbook
- [ ] Weekly QA pass on all transcripts; maintain a prompt-fix changelog
- [ ] Ask pilot #1: *"Any call this week you'd have missed without it? What was it worth?"* — log the dollar figure
- [ ] Fix the top 3 recurring agent mistakes found in transcripts

### Week 8 — Pilot 5, proof, and the next 90 days
- [ ] Close and onboard pilots #4 and #5
- [ ] Compile the proof sheet: total calls answered across pilots, after-hours count, owner-confirmed saved jobs with dollar values
- [ ] Collect first testimonial (text is fine, 60-sec phone video is gold) + 2 referral intros from happiest pilot
- [ ] Send the first monthly "CallCatch answered N calls" report to all pilots
- [ ] Decide v2 priority from pilot demand — default order: **Zapier/Jobber push → Spanish → calendar booking**
- [ ] Set the standard price ($199) for all customers from #6 onward; book 5 referral-sourced demos for Weeks 9–10

---

**The three decisions that matter most, restated:** (1) Build on Retell, not raw telephony — your scarce resource is weeks, not per-minute cents. (2) Ship lead capture + emergency transfer, not booking — capture is 90% of the value at 30% of the risk. (3) Charge $99 from pilot #1 and $199 from customer #6 — the demo where his own phone buzzes with his own fake emergency is worth more than any discount.
