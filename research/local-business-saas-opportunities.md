# Local SMB SaaS Opportunity Report
**Prepared for a solo founder with direct relationships to local small business owners — July 2026**

This report is built on realistic operational knowledge of how these businesses actually run day to day, what their owners complain about, and what a one-person technical founder can credibly build and sell face-to-face. It ends with a ranked problem table, ten ranked product recommendations, and a 90-day execution plan. Where I name incumbent tools, it's because your prospects are already using (and often hating or half-using) them — knowing those names will make you sound credible in sales conversations.

One framing note before the categories: **the businesses in your list split into two economic profiles.** Transaction businesses (restaurants, bars, liquor, convenience, grocery, retail) live on thin margins, high volume, inventory, and hourly staff. Appointment/job businesses (barbers, salons, events, catering, home services) live on bookings, quotes, deposits, and no-shows. The best SaaS opportunities cluster around problems shared *within* one of these profiles, because that's how referrals travel — a barber refers you to another barber, not to a liquor store.

---

## 1. Restaurants

**Daily workflow.** The owner (often also the head cook or front-of-house manager) arrives mid-morning: checks last night's sales on the POS, counts the drawer, receives deliveries (produce, protein, dry goods — 3-6 vendors a week, each with a paper invoice), preps, handles a callout text from a line cook, adjusts the schedule, runs the lunch service, does a supply run because the delivery shorted them, runs dinner service, closes at 10-11pm, and does the deposit. Weekly: builds next week's schedule (usually in a spreadsheet, a whiteboard, or a group text), places orders with each vendor separately (phone, text, or a clunky vendor portal), runs payroll, and — rarely — counts inventory.

**Biggest operational problems.**
- Scheduling and callouts. The schedule is rebuilt every week from memory of availability, and every shift callout triggers a 30-minute scramble of texting people individually.
- Vendor chaos: each supplier has its own ordering channel and cutoff time; a missed cutoff means a supply run at retail prices.
- Prep and 86'd items: no one knows what to prep in what quantity except the one experienced person, so slow Tuesdays over-prep and busy Fridays run out.
- Communication is a group text that mixes memes, callouts, and "we're out of ranch."

**Biggest financial problems.** Food cost creep is the silent killer — ingredient prices moved but menu prices didn't, so a dish that was 28% food cost is now 36% and nobody noticed for four months. Owners find out at tax time, not in real time. Also: labor cost as % of sales (overstaffed slow shifts), invoice errors from vendors (short deliveries and price changes that never get checked against the invoice), and shrink from over-portioning and comps. Cash flow is weekly-tight; a slow week plus a payroll Friday plus a big Sysco invoice is a genuine crisis.

**Marketing challenges.** They know Google reviews and Instagram matter but have no time. Photos get posted in bursts then stop for two months. They can't answer the phone during rushes (missed calls = lost reservations and catering inquiries, which are the highest-margin orders). Third-party delivery apps take 20-30% and own the customer data.

**Employee management.** Turnover of 75-100%+/year is normal. Training is "shadow Maria for two shifts." No-shows and last-minute callouts are the #1 stress. Nobody reads the group chat announcements.

**Inventory challenges.** Almost nobody counts weekly; when they do it's clipboard-and-Excel, takes 3 hours, and the numbers don't tie to anything. Invoices pile up in a folder. Waste isn't tracked at all — it just leaves in the trash.

**Customer retention.** No real loyalty system beyond a punch card if anything. They don't know who their regulars are by name in any system. A bad Google review sits unanswered for weeks. They have no list of customers to email/text when a slow Tuesday needs filling.

**AI opportunities.**
- **AI phone answering** (voice agent): answer calls during rush, take reservations/takeout orders, answer "are you open / do you have gluten-free" questions. This is the single most concrete, measurable AI win in the category — missed calls are directly countable.
- Invoice OCR: photograph the Sysco invoice, extract line items and prices, flag price increases vs. last order, auto-update food cost per dish. (MarginEdge does this at $330+/mo — too expensive for small independents; there's a gap under $150.)
- Review response drafting and reputation monitoring.
- Sales forecasting for prep/labor ("this Friday will do ~$4,200 based on weather + history").

**Automation opportunities.** Shift-swap and callout broadcast ("who can cover 5pm?" goes to all qualified staff, first-accept wins). Auto-request Google reviews after visits. Low-stock reorder reminders keyed to vendor cutoff times. Automated "we miss you" texts to lapsed regulars.

**Tools they currently use/hate:** Toast or Clover POS (locked in, expensive add-ons), 7shifts or Homebase (or a whiteboard), group texts, a shoebox of invoices, QuickBooks touched only by the bookkeeper.

---

## 2. Bars

**Daily workflow.** Opens afternoon, peaks 9pm-1am. Owner or bar manager does the liquor order (usually eyeballing the shelf), receives distributor deliveries on set weekly days (in many states, liquor distribution is regulated and rigid — miss the order window, wait a week), stocks, staffs the night, closes at 2am counting drawers, and deals with the aftermath (incidents, comps, breakage). Weekly: inventory (rarely done properly), events/promo planning, schedule.

**Biggest operational problems.** Same scheduling/callout chaos as restaurants but with a harder labor pool (late-night staff, high flake rate). Keg and bottle stockouts on a Saturday night. Event/promo nights (trivia, live music, game days) are planned in someone's head and promoted inconsistently.

**Biggest financial problems.** **Pour cost and shrinkage is the defining problem.** Industry norm is 18-24% pour cost; a badly monitored bar runs 28-35%. The gap is overpouring, free drinks to friends, unrecorded comps, and outright theft. On $500k/year of liquor sales, 5 points of pour cost is $25,000 — real money the owner *feels* but can't pinpoint. Owners also complain about credit card fees on small tabs and cash handling discrepancies.

**Marketing challenges.** Bars live and die on "what's happening tonight." They post events erratically on Instagram, never update Google Business hours/events, and have no way to text regulars "trivia at 8, half-price wings." Slow nights (Mon-Wed) are the profit gap.

**Employee management.** Bartender theft/over-comping is an accountability problem owners feel powerless about — they suspect but can't prove. Turnover high, training informal, tip disputes constant.

**Inventory challenges.** Liquor inventory is famously miserable: weighing or eyeballing hundreds of open bottles. Tools exist (Partender, BevSpot, WISK, Backbar) and are widely disliked as tedious or priced for volume bars. Most small bars just don't do it, which is why theft is invisible.

**Customer retention.** Regulars are the whole business, and they're managed entirely by bartender memory. No list, no birthday club, no way to reactivate someone who stopped coming.

**AI opportunities.** Computer vision on the pour is real tech (Glimpse et al.) but hardware-heavy — wrong for a solo founder. Realistic: variance analytics that compare POS sales to purchase invoices ("you bought 12 bottles of Tito's, sold the equivalent of 8.5 — here's your $ leak by category"), invoice OCR for distributor invoices, AI-drafted event promo content pushed to Instagram/Google/SMS from one prompt.

**Automation opportunities.** Event promotion pipeline: enter "Trivia Thursday 8pm" once → auto-posts to Google Business, Instagram, Facebook, and an SMS blast to opted-in regulars. Scheduled inventory-count reminders with a fast mobile count flow. Comp-logging that requires a reason code.

**Tools they use/hate:** Same POS family as restaurants; Untappd for beer menus; almost universal absence of any CRM/loyalty. Inventory in Excel or not at all.

---

## 3. Liquor stores

**Daily workflow.** Owner-operated retail with long hours (10am-10pm, 7 days). Morning: receive distributor deliveries (multiple per week, each with dense multi-page invoices), check in cases, price and shelve, update shelf tags. All day: register, ID checks, restocking. Weekly/monthly: ordering from distributors (often via rep visits or clunky portals), lottery reconciliation, occasional full inventory (dreaded — 3,000-8,000 SKUs).

**Biggest operational problems.** SKU volume is the story: thousands of items, constant new products, price changes from distributors that don't make it to shelf tags or the POS (selling at old prices = silent margin loss). Receiving is manual case-counting against paper invoices, and distributors make errors regularly.

**Biggest financial problems.** Inventory *is* the balance sheet — $100k-400k of cash sitting on shelves. Dead stock (that dusty allocation of flavored whiskey) ties up cash for years. Margin is thin on beer (20-25%), better on wine/spirits (30-40%), and owners often don't know per-category margin because costs in the POS are stale. Shrink from theft (customer and employee) runs 1-3% of sales. Credit card fees on high average tickets sting.

**Marketing challenges.** Differentiation is hard against Total Wine and grocery. Their edge is selection, allocation drops (rare bourbon), and relationships — but they have no way to tell their best customers "the Blanton's came in." Email/SMS lists are rare; when a hot allocation arrives it sells via personal texts from the owner's phone.

**Employee management.** Fewer staff than restaurants (2-6), but trust is the issue: register access, ID-check compliance liability, and theft. Turnover moderate.

**Inventory challenges.** The worst in your list alongside c-stores. POS item files are dirty (duplicate SKUs, wrong costs, unlinked barcodes). Cycle counts don't happen. Reordering is gut feel + rep suggestions (reps optimize for their book, not the store).

**Customer retention.** Genuinely strong personal loyalty, zero systematization. A "rare drop alert" list is the most obvious retention weapon in the whole report — customers *want* these texts.

**AI opportunities.** Invoice-to-POS ingestion (OCR distributor invoices → auto-update costs, flag price changes, generate shelf-tag print queue). Dead-stock detection and markdown suggestions ("these 40 SKUs haven't sold in 120 days; $6,800 in trapped cash"). Demand forecasting for beer around holidays/game days.

**Automation opportunities.** SMS allocation/drop alerts with opt-in list per category (bourbon hunters, natural wine people). Auto-reorder suggestions by velocity. Price-change alerts.

**Tools they use/hate:** mPower, Bottle POS, Liquor POS/ITE, Clover — generally dated, and the item-file mess is universal. Ordering via distributor portals (Southern Glazer's Proof, RNDC eRNDC) that they tolerate at best.

---

## 4. Convenience stores

**Daily workflow.** Long hours, thin staffing (often 1 person per shift, family labor). Constant vendor stream: chips rep, soda rep, beer distributor, cigarette/tobacco rep, grocery wholesaler cash-and-carry runs. Lottery management (activation, reconciliation, payouts) eats a surprising hour+ daily. Owner is behind the counter more than any other category on this list.

**Biggest operational problems.** Vendor-managed categories mean reps stock shelves and hand you an invoice — owners rarely verify. Price changes (especially tobacco) are frequent and manual. Coolers go down; food-service compliance if they do hot food. The owner cannot leave the store, which limits everything else.

**Biggest financial problems.** Razor margins overall, propped up by tobacco (high volume, ~15% margin, huge cash tied up), lottery (5-6% commission), and drinks/snacks. **Shrink is severe** — employee theft at the register (voids, no-sales, sweethearting) and customer theft; owners with cameras don't have time to watch them. Cash-heavy operations mean deposit discrepancies. Cigarette inventory is $20-50k of cash on a shelf behind the counter.

**Marketing challenges.** Mostly location-driven; marketing is the weakest lever here. Some upside in Google Business accuracy and food-service promotion, but c-store owners largely don't buy marketing tools.

**Employee management.** Trust and register accountability dominate. Training is minimal; the problem is monitoring, not skill.

**Inventory challenges.** Thousands of SKUs, dirty item files, no cycle counting, tobacco counted by hand daily-ish because of theft risk. Scan-based ordering exists at chains, not independents.

**Customer retention.** Foot traffic loyalty is habitual, not managed. Little realistic SaaS surface.

**AI opportunities.** POS exception monitoring: AI flags suspicious transaction patterns (excessive voids, no-sales, refunds by employee/shift) and pairs them with camera timestamps. Invoice OCR for the parade of vendor invoices. Honest assessment: this category is **hard to sell software to** — owners are time-poor, price-sensitive, and often not software-oriented. Treat c-stores as a secondary market for tools built for liquor stores/grocers, not a primary target.

**Automation opportunities.** Daily cash/lottery reconciliation worksheet automation; price-change task lists; temperature monitoring alerts for coolers (hardware-adjacent, skip).

**Tools they use/hate:** Modisoft, Clover, cash registers that aren't even POS systems, paper lottery logs.

---

## 5. Small independent supermarkets

**Daily workflow.** 6am receiving (produce, dairy, bread, meat — daily), department heads (meat, produce, deli) run mini-businesses inside the store, ordering happens per-department daily/every-other-day, price changes and shelf tags weekly, weekly ad/circular production (a real weekly project — many still do print + Facebook), perishable culling multiple times daily.

**Biggest operational problems.** Perishables management is the core craft: order too much produce and it rots, too little and shelves look bare (bare shelves kill grocery stores). Department coordination, receiving verification against invoices from 10-20+ vendors, and the weekly ad workflow (deciding deals, updating POS prices, making the flyer, posting it) which routinely consumes a full day of someone's week.

**Biggest financial problems.** 1-3% net margins — the thinnest in this report. Shrink (spoilage + theft) of 2-4% of sales can be the difference between profit and loss. Cash flow is actually decent (customers pay instantly, vendors on terms), but any margin-management sloppiness is fatal. Stale costs in the POS mean they don't know item-level margin.

**Marketing challenges.** The weekly ad is their marketing, and producing it is painful. Competing with chains on price is impossible; competing on ethnic specialty, meat counter, produce quality is how independents survive — but they're bad at broadcasting that (no email list, weak social, outdated Google listings).

**Employee management.** Larger staffs (10-40), scheduling across departments, high turnover in cashier/stocker roles, department-head dependency (if the meat guy quits, the department bleeds).

**Inventory challenges.** Perpetual inventory basically doesn't exist at independents; ordering is department-head gut feel. Waste tracking is a clipboard, if that.

**Customer retention.** Loyalty programs exist at chains; independents rarely have one. The weekly ad email/SMS list is the realistic retention tool.

**AI opportunities.** AI-generated weekly ad workflow: pick deal items → AI produces the flyer (print PDF + social images + email + SMS) and a POS price-change file. Produce order forecasting from POS movement + weather + weekly patterns. Invoice OCR at grocery vendor volume.

**Automation opportunities.** Shelf-tag print queues from price changes; markdown scheduling for near-expiry items; department ordering checklists.

**Tools they use/hate:** ECRS Catapult, IT Retail, LOC/Toshiba — competent but old POS systems; weekly ad made in Publisher or by a local print shop; ordering via wholesaler portals (UNFI, C&S) they find clunky. Note: independents are fewer in number than the other categories — good ACV potential ($200-500/mo is plausible) but a thin local market. A niche play, not a first play.

---

## 6. Barbershops

**Daily workflow.** Barbers are often booth renters or commission (50-70/30 splits), not employees — this changes everything: the "owner" manages a building and a brand, while each chair is its own micro-business. Day: appointments every 30-45 min, walk-ins filling gaps, cash/Venmo/Zelle payments mixed with card, constant phone/DM interruptions for booking. The owner cuts hair all day *and* runs the business in the cracks.

**Biggest operational problems.** Booking friction and interruption: answering DMs and texts mid-cut. No-shows and late arrivals wreck the day's grid — a 30-minute no-show is unrecoverable revenue. Walk-in vs. appointment balancing. Booth-rent collection ("chasing rent") is the owner's most awkward recurring task.

**Biggest financial problems.** No-shows (10-20% without enforced deposits), unreported cash income complicating everything, booth renters late on rent, and per-booking fees from apps (Booksy's model of charging clients/new-client fees is actively resented). A busy barber loses $200-500/month to no-shows alone.

**Marketing challenges.** Instagram is the portfolio and it works — the challenge is consistency and converting followers to booked appointments. Google reviews matter for new-to-town clients. Slow days (Mon-Tue) sit empty while Saturdays turn people away; nobody manages that yield.

**Employee management.** Not employment, but chair management: recruiting good barbers, keeping them from leaving with "their" clients, and enforcing shop standards over independent contractors with no leverage.

**Inventory challenges.** Minimal (product retail is small). Skip.

**Customer retention.** Actually strong — clients are loyal to *the barber*. The gap is rebooking cadence: a client who comes every 3 weeks slipping to 5 weeks is a 40% revenue cut from that client, invisible to everyone. Automated "time for your cut" nudges measurably fix this.

**AI opportunities.** AI receptionist for DMs/texts/calls that books appointments while the barber is cutting — high resonance, because every barber personally feels the interruption problem. AI-drafted Instagram posts from before/after photos.

**Automation opportunities.** Deposit-enforced booking, automated reminders (cuts no-shows ~50-70%), rebooking nudges based on each client's cadence, booth-rent auto-collection (recurring card charge with late-fee logic), fill-the-gap texts ("2pm just opened up") to a waitlist.

**Tools they use/hate:** Booksy (widely used, widely griped about — fees, client poaching fears, spammy marketplace), Squire (good but $100+/mo positioned for bigger shops), the booking-link-in-bio + DM hybrid, and pure text-message books. Many barbers still run their book entirely in iPhone Notes and texts.

---

## 7. Beauty salons

**Daily workflow.** Similar rhythm to barbershops with longer, higher-ticket services (color: 2-4 hours, $150-400+), mixed employment models (commission, booth rental, hourly), retail product sales at the desk, and heavier consultation needs (color history, patch tests, formulas). Front desk — if one exists — juggles phones, checkouts, and rebooking; in smaller salons the stylist does it all between clients.

**Biggest operational problems.** No-shows on long appointments are catastrophic (a no-showed 3-hour color block can't be refilled same-day). Formula records (each client's color recipe) live in a card file or the stylist's notebook — lose the notebook or the stylist, lose the client. Consultation and booking mismatches ("I booked a trim" arrives wanting a full color correction) blow up the schedule.

**Biggest financial problems.** No-shows and late cancels on high-ticket services — the highest per-incident cost of any category here ($200-400 each). Underpricing (services not repriced as color/product costs rose 20-30%). Retail inventory shrink. Commission/booth-rent math disputes.

**Marketing challenges.** Instagram/TikTok before-afters drive new clients; consistency is the struggle. Reviews matter enormously for color work (expensive + trust-based). New-client acquisition cost via marketplaces (Booksy, Vagaro marketplace, Yelp ads) irritates owners.

**Employee management.** Stylist retention is existential — a departing stylist takes her book. Training/apprenticeship is long. Chair drama is real. Same contractor-leverage problem as barbershops.

**Inventory challenges.** Color and backbar inventory is genuinely wasted (over-dispensed color down the drain — estimated 10-25% of color cost) but solutions require weighing hardware (Vish); not a solo-founder play. Retail product reordering is manual.

**Customer retention.** Rebooking-before-leaving rates are the metric that matters and desks forget to ask. Lapsed-client win-back (the 8-week color client who's at week 13) is money on the ground. Birthday/loyalty programs are known to work and rarely maintained.

**AI opportunities.** Same AI receptionist thesis as barbershops (calls/DMs → booked, with service-specific questions: "is this a root touch-up or full color?"). AI-structured client notes: stylist dictates 20 seconds after the appointment, gets a searchable formula/preference record. Review responses.

**Automation opportunities.** Deposits, reminders, cadence-based rebooking nudges, retail restock alerts, post-visit review requests, pre-appointment consultation forms (kills the booking-mismatch problem).

**Tools they use/hate:** Vagaro, GlossGenius, Fresha (free but monetizes via payment fees and marketplace, which owners distrust), Boulevard (loved but $175+/mo, aimed upmarket), Square Appointments. This is a crowded tooling category — differentiation must come from the AI-receptionist/lapsed-revenue angle, not from being another booking calendar.

---

## 8. Event companies

(DJs, party rental, planners, photo booths, AV, décor — typically 1-10 people.)

**Daily workflow.** Weekdays: responding to inquiries (speed-to-lead decides who wins the job), sending quotes, chasing signatures and deposits, coordinating vendors/venues, logistics planning. Weekends: load truck, set up, run event, tear down, unload at midnight. The pipeline lives across email, Instagram DMs, The Knot/Thumbtack leads, texts, and a notebook.

**Biggest operational problems.** **Lead response and quote turnaround** — inquiries answered in under an hour book at multiples of those answered next-day, and most owners answer next-day because they're at an event. Double-booking equipment/staff across events. Detail loss between the sales conversation and the event-day crew ("the client said gold linens" lives in a text thread nobody re-reads).

**Biggest financial problems.** Deposits not collected or chased manually; final balances due before the event slipping to after (then requiring awkward collection); underquoting because there's no cost template; extreme seasonality (May-June + Sept-Oct weddings vs. dead January) creating winter cash crunches.

**Marketing challenges.** Paying The Knot/WeddingWire/Thumbtack heavy fees for shared leads. Reviews are the #1 conversion asset and requesting them post-event is always forgotten. Referral relationships with venues/planners are gold and managed entirely by memory.

**Employee management.** Gig-based crews confirmed by group text — "who can work the Sanchez wedding on the 14th?" — with flake risk on the most unforgiving deadline imaginable (the wedding starts whether your staff shows or not).

**Inventory challenges (rental/décor).** What's in the warehouse, what's reserved for which date, what came back broken — tracked in spreadsheets, causing double-book disasters.

**Customer retention.** Weddings don't repeat, but corporate/venue/planner relationships do. Post-event review + referral automation is the retention play.

**AI opportunities.** AI inquiry responder: replies to leads within minutes, asks qualifying questions (date, venue, headcount, budget), checks date availability, and drafts a quote for owner approval. Because speed-to-lead has a direct booking-rate effect, ROI is provable. AI-drafted proposals from a short brief.

**Automation opportunities.** Quote → e-sign → deposit in one link (HoneyBook's core, but HoneyBook is generic and owners find it heavy); payment-plan auto-charging; event-day run sheets auto-compiled from the client thread; crew confirmation with escalation ("Jake hasn't confirmed, ping Marcus").

**Tools they use/hate:** HoneyBook ($36-79/mo, common, "bloated"), Dubsado (powerful, notoriously hard to set up), spreadsheets + Google Calendar, Thumbtack (resented per-lead fees). Rental-specific: Goodshuffle/EventOffice, priced upmarket.

---

## 9. Catering companies

**Daily workflow.** A hybrid of restaurant and event company. Weekdays: quoting (custom menus per event — every quote is bespoke math on ingredients, labor, rentals, travel), tastings, prep-list building, ordering per event, staffing per event. Event days: production kitchen sprint, pack-out (the checklist moment where forgetting the chafing fuel ruins everything), delivery/service, breakdown. Corporate drop-off caterers run a tighter daily loop: orders in by 3pm for tomorrow, production schedule, route planning.

**Biggest operational problems.** **Custom quoting is slow and error-prone** — building a per-person menu price from scratch takes 1-3 hours, and underquoting labor or rentals eats the margin. Scaling recipes from 10 to 150 portions by hand causes real production errors. Pack-out list omissions. Staffing gig servers per event (same group-text flake problem as events).

**Biggest financial problems.** Quoting errors (the most direct margin leak), corporate clients on net-30 that drift to net-60 (unpaid invoices matter here more than anywhere else in this report), deposit discipline, seasonality.

**Marketing challenges.** Corporate accounts are the recurring-revenue prize and are won by relationships + response speed on quote requests. Wedding leads via the same fee-heavy marketplaces as event companies.

**Employee management.** Small core kitchen + on-call server bench; the bench decays constantly and rebuilding it is unmanaged.

**Inventory challenges.** Per-event ordering, so less standing inventory, but event-costing (did the Nguyen wedding actually make money?) is almost never computed.

**Customer retention.** Corporate reorder automation ("it's been a month since Acme's last team lunch") is unclaimed money. Post-event review/referral asks forgotten.

**AI opportunities.** AI quote builder: "plated dinner for 120, chicken/veg option, June, 45 minutes away" → costed draft quote from the caterer's own recipe/pricing data. Recipe scaling + prep list + shopping list generation from the booked menu. Inquiry auto-response as with event companies.

**Automation opportunities.** Quote-to-contract-to-deposit links; payment schedules with auto-charge; invoice chasing sequences for corporate net-30s; pack-out checklists auto-generated per event type; staff-booking blasts with confirm/decline tracking.

**Tools they use/hate:** Excel above all — quoting, costing, prep lists all live in spreadsheets. Curate and Total Party Planner exist ($150-350/mo) and skew to larger caterers; small caterers find them expensive and rigid. This category has the strongest "still on Excel" signal in the report.

---

## 10. Local retail stores

(Boutiques, gift shops, bookstores, hobby/game stores, pet supply, hardware — 1-2 locations.)

**Daily workflow.** Open/close, receive shipments, price and merchandise, work the floor and register, post product to Instagram/Facebook, reorder from dozens of small vendors and marketplaces (Faire changed this — ordering is easier, discipline isn't), quarterly-ish buying decisions that make or break the year.

**Biggest operational problems.** Buying is the skill and it's unsupported: what sold, what's stale, what to reorder is answered by gut. POS item files are dirty. E-commerce/in-store sync (if they sell online) breaks constantly. The owner is the only one who can do half the tasks.

**Biggest financial problems.** **Cash trapped in dead inventory** — the defining financial problem. A boutique with $80k of stock where $25k hasn't turned in six months has a cash flow problem masquerading as an inventory problem. Markdown decisions are made too late. Seasonal buys (holiday) are cash-flow cliffs. Shoplifting shrink.

**Marketing challenges.** Instagram is the storefront; consistency is the failure mode. Email lists exist (Mailchimp, half-abandoned). Events (trunk shows, launches) work and are under-promoted. Competing with Amazon on anything but curation/community is futile and they know it.

**Employee management.** 1-5 part-timers; lighter pain than food service. Scheduling is simple; the issue is that staff can't answer product questions the owner could.

**Inventory challenges.** Covered above — it's the heart of the category. Physical counts annual at best; receiving discrepancies unchecked; no sell-through reporting anyone looks at.

**Customer retention.** Best customers are known by face, not by data. A "your favorite designer just dropped" text list would outperform anything they currently do. Loyalty programs exist in their POS and sit unconfigured.

**AI opportunities.** Plain-English inventory analyst on top of Square/Shopify/Lightspeed data: "What should I reorder this week? What should I mark down? What's my best cash move before Q4 buying?" — turning reports nobody reads into answers. AI product-photo-to-post pipelines for Instagram/e-commerce listings.

**Automation opportunities.** New-arrival broadcasts (photo → post + email + SMS), reorder-point alerts, markdown scheduling by age, win-back emails by purchase history.

**Tools they use/hate:** Square or Shopify POS (fine), Lightspeed (grumbled about), Faire for wholesale (liked), Mailchimp (abandoned), Instagram (time sink). The gap is a decision layer, not another system of record.

---

## 11. Small service businesses

(Cleaning, landscaping/lawn care, auto repair, handyman, pressure washing, pool service, small HVAC/plumbing operators — 1-10 field workers.)

**Daily workflow.** Owner's day starts at 6-7am dispatching crews (or driving a truck themselves), then all day: quoting new jobs (drive-by estimates or site visits), fielding calls *while on a ladder / under a car*, juggling the schedule when a job runs long or it rains, buying materials, and evenings doing invoices and chasing payments at the kitchen table. Recurring-service businesses (cleaning, lawn, pool) run route-based weeks; job-based businesses (repair, HVAC) run reactive schedules.

**Biggest operational problems.** **The missed call is the canonical problem**: a homeowner with a leak calls three plumbers and hires whoever answers. Solo operators miss 30-60% of calls because they're working. Second: scheduling chaos from weather, overruns, and cancellations, communicated by text. Third: quote follow-up — estimates sent and never chased (following up once lifts close rates dramatically; almost no one does it).

**Biggest financial problems.** **Unpaid invoices and slow collection** — worst in this report. Net-30 that becomes net-90; awkwardness about chasing money from neighbors; invoices sent days after job completion (or forgotten entirely — real operators genuinely lose billable jobs in text threads). Underquoting from no job-costing. Seasonal cash cliffs (landscaping winters).

**Marketing challenges.** Google reviews and Google Business ranking are nearly the entire funnel for "plumber near me." They know it, and still don't systematically request reviews. Lead-gen services (Angi, Thumbtack) charge $15-80/shared lead and are the most universally hated vendors in this entire report. Yard signs and referrals still work.

**Employee management.** Hiring reliable field labor is the #1 complaint in interviews with these owners, every time. No-show mornings strand routes. Accountability in the field ("did the crew actually edge the beds?") is managed by callbacks and complaints. Payroll hours via text message honor system.

**Inventory challenges.** Light — truck stock and materials per job. Not a wedge.

**Customer retention.** Recurring-service businesses have structural retention but lose customers silently through service slippage. Job-based businesses forget past customers entirely — no annual "time for your AC tune-up / gutter cleaning" reactivation, which is free revenue.

**AI opportunities.** **AI phone agent that answers, quotes ballparks, and books jobs** — the single highest-resonance AI pitch across all 11 categories, because the owner *knows* they miss calls and *knows* each missed call is a $200-3,000 job. Also: photo-based estimate drafting ("here are 5 photos of the deck" → materials + labor draft), and voice-note-to-invoice ("I replaced the wax ring and supply line at the Hendersons, hour and a half" → line-itemed invoice ready to send).

**Automation opportunities.** Instant missed-call text-back ("Sorry we missed you — what do you need? We'll call back within the hour" — trivial to build, measurably converts). Quote follow-up sequences. Invoice-on-completion with card payment link and auto-reminders. Review requests on payment. "On my way" texts. Seasonal reactivation campaigns.

**Tools they use/hate:** Jobber ($39-199/mo, the standard, decent but many operators use 20% of it or find it expensive as they add users), Housecall Pro (similar), ServiceTitan (enterprise, irrelevant here), and — the real competitor — **text messages, a paper calendar, and QuickBooks invoices sent late.** A huge fraction of 1-3 person operators have no software at all. This is the largest, most reachable, most underserved segment in the report.

---

## Cross-Category Problem Ranking

Scores are 1-5 (5 = highest). **Composite = Frequency + Financial Impact + Market Demand + Willingness to Pay − Difficulty** (so easier problems rank higher). Sorted by composite.

| # | Problem | Freq | Fin. Impact | Difficulty | Demand | WTP | Composite | Notes |
|---|---------|------|-------------|------------|--------|-----|-----------|-------|
| 1 | Missed calls/DMs = lost bookings & jobs | 5 | 5 | 2 | 5 | 5 | **18** | Services, barbers, salons, restaurants, events, catering. Directly countable ROI. Voice/LLM tech is ready. |
| 2 | No quote/estimate follow-up & slow lead response | 4 | 5 | 2 | 4 | 5 | **16** | Services, events, catering. Pure revenue recovery; simple sequences win. |
| 3 | No-shows & late cancellations | 4 | 4 | 1 | 4 | 4 | **15** | Barbers, salons, restaurants (reservations), services. Deposits + reminders are proven fixes. |
| 4 | Late/unpaid invoices, manual collection | 4 | 5 | 2 | 4 | 4 | **15** | Services, catering, events. Awkwardness is the real barrier; automation removes it. |
| 5 | Lapsed-customer reactivation (nobody wins back regulars) | 5 | 4 | 1 | 3 | 4 | **15** | Nearly universal. Easy tech; demand is latent (owners don't search for it, but buy when shown). |
| 6 | Review generation & reputation management | 5 | 4 | 1 | 4 | 3 | **15** | Universal. Crowded space (NiceJob, Podium at $250+/mo) — win on price + bundling. |
| 7 | Callouts, no-shows & shift-swap scrambles (staff) | 4 | 4 | 2 | 4 | 4 | **14** | Restaurants, bars, grocery, events, catering. 7shifts/Homebase exist; the gap is the callout moment, not the schedule grid. |
| 8 | Deposit/payment collection friction (quote→sign→pay) | 4 | 4 | 2 | 4 | 4 | **14** | Events, catering, salons, services. HoneyBook is the incumbent; verticalized versions still win locally. |
| 9 | Slow bespoke quoting (catering, events, services) | 3 | 5 | 2 | 4 | 4 | **14** | Fewer categories but huge per-business impact; Excel is the competitor. |
| 10 | Vendor invoice chaos → stale costs → silent margin erosion | 4 | 5 | 3 | 3 | 4 | **13** | Restaurants, bars, liquor, c-store, grocery. OCR/LLM extraction is now genuinely feasible solo; MarginEdge proves WTP at $330/mo. |
| 11 | Dead stock / cash trapped in inventory | 4 | 5 | 3 | 3 | 4 | **13** | Liquor, retail, grocery, c-store. Needs POS data access; analysis layer is buildable. |
| 12 | Slow-night/slow-day demand filling | 4 | 4 | 2 | 3 | 3 | **12** | Bars, restaurants, barbers, salons. SMS-list dependent; pairs with #5. |
| 13 | One-entry-many-channels marketing (post/event/new arrival everywhere) | 5 | 3 | 2 | 3 | 3 | **12** | Universal; social APIs are the annoyance. Better as a feature than a product. |
| 14 | Pour cost / bar shrinkage | 2 | 5 | 3 | 4 | 4 | **12** | Bars only, but severe. Variance analytics (POS vs. purchases) is the solo-feasible angle. |
| 15 | Institutional knowledge in one person's head (formulas, recipes, prep) | 4 | 3 | 2 | 2 | 3 | **10** | Salons, restaurants, catering, grocery. Real but latent demand — hard to sell proactively. |
| 16 | Employee theft / register shrink | 4 | 4 | 4 | 3 | 3 | **10** | Bars, liquor, c-store, retail. POS-exception analytics feasible; trust-sensitive sale. |
| 17 | Food/perishable waste & prep forecasting | 3 | 4 | 4 | 3 | 3 | **9** | Restaurants, grocery, catering. Forecasting is doable; data plumbing per-POS is the drag. |
| 18 | Field/gig staff accountability & confirmation | 3 | 3 | 3 | 3 | 3 | **9** | Services, events, catering. Confirmation loops easy; "proof of work" harder. |
| 19 | Hiring & bench-building for hourly/gig labor | 5 | 4 | 5 | 3 | 2 | **9** | Universal and severe, but a solo SaaS can't manufacture workers — avoid as a core product. |
| 20 | POS lock-in / dirty item files | 4 | 3 | 5 | 2 | 2 | **6** | Real pain, terrible business to attack solo. Integrate, don't replace. |

**Read of the table:** the top of the list is dominated by *revenue-recovery communication problems* — missed calls, unfollowed quotes, no-shows, unpaid invoices, lapsed customers. These share three properties: countable dollar impact (easy to prove ROI in a sales conversation), low technical difficulty (SMS + payments + LLM), and no dependency on replacing a POS. The bottom of the list is where good intentions go to die: hiring, POS replacement, hardware-dependent shrink detection.

---

## Top 10 SaaS Product Recommendations

Ranked best to weakest. **#1 rationale:** CallCatch attacks the single highest-composite problem, has provable per-call ROI, targets the largest and least software-served segment in the report (1-10 person home/field service operators), and is demoable in 90 seconds by literally calling a phone number in front of the owner — the perfect product for relationship-based selling.

### 1. CallCatch — AI receptionist for home-service operators
- **Problem:** Solo and small service operators (plumbing-adjacent, HVAC, cleaning, landscaping, auto repair) miss 30-60% of inbound calls while working; each missed call is a $150-3,000 job that goes to whoever answers.
- **Target customer:** 1-10 person field service businesses without office staff. Secondary: barbershops/salons (see #3).
- **Core features (MVP):** (1) AI voice agent answers, qualifies (what/where/when), and books into a simple calendar or takes a structured message; (2) instant missed-call text-back fallback for calls the agent shouldn't take; (3) transcript + summary pushed to the owner by SMS; (4) after-hours emergency triage ("is water actively leaking?") with escalation call to the owner; (5) simple dashboard of calls caught and estimated revenue saved.
- **Price:** $99-199/mo (tiers by call volume). Reasoning: one saved job per month pays for a year; incumbents (Smith.ai human receptionists) charge $300-700/mo, anchoring high; Jobber owners already pay $100+/mo, proving WTP.
- **Why you're positioned:** You can demo it live — hand the owner your phone, have them call their own new number, watch it book a job. Home-service owners are dense referrers (they meet each other at supply houses); one happy landscaper introduces you to three.
- **Biggest risk:** Voice-agent quality on messy real calls (accents, background noise, rambling callers) — a bad first week kills trust. Mitigate with the text-back fallback and a "human review" mode for month one.

### 2. QuoteChaser — estimate follow-up and payment collection for job businesses
- **Problem:** Estimates sent and never followed up (#2), invoices unpaid for 60-90 days (#4). Owners hate chasing money; software doesn't get embarrassed.
- **Target:** Same home-service segment as #1, plus caterers and event companies. Ideal profile: sends 10-60 quotes/month, closes 25-40%, wishes it were 50%.
- **Core features:** (1) Send quote via link with e-accept + deposit payment (Stripe); (2) automatic polite follow-up sequence (day 2, 5, 10) via SMS/email, AI-personalized; (3) invoice on completion with pay link + escalating reminders; (4) "money on the table" dashboard (outstanding quotes and invoices in $); (5) QuickBooks sync-lite (export).
- **Price:** $59-99/mo. Below Jobber's useful tiers, above trivial. A single recovered $800 quote per quarter justifies it.
- **Why you:** ROI conversation is arithmetic the owner can verify from their own texts. Natural cross-sell/bundle with CallCatch — same buyer, same pitch meeting.
- **Biggest risk:** Jobber/Housecall Pro do pieces of this; you must win the "I don't want a big system, I want my money" customer. Also SMS compliance (A2P 10DLC registration) is an annoying setup tax — handle it for the customer as a feature.

### 3. ChairBack — no-show elimination and rebooking engine for barbers/salons
- **Problem:** No-shows ($200-500/mo per barber; $200-400 per incident for color work), lapsed clients drifting from 3-week to 6-week cadences, and DM/call interruptions mid-service.
- **Target:** Independent barbers, booth renters, and 2-8 chair shops/salons — especially those on Notes-app-and-texts or resenting Booksy's fees.
- **Core features:** (1) Booking link with card-on-file deposits and no-show fees; (2) smart reminders (48h/2h) with one-tap confirm/reschedule; (3) cadence tracking with automatic "time for your cut, tap to book" nudges when a client's personal interval lapses; (4) AI text/DM responder that books while they're cutting; (5) gap-fill blasts to a waitlist when a slot opens.
- **Price:** $39-69/mo per barber/stylist (this segment pays personally, so price under $70; Squire's $100+ leaves room underneath). No per-booking fees — that's the anti-Booksy positioning.
- **Why you:** Barbershops are the most social, most referral-dense category on the list; if you know two barbers you soon know twenty. The deposit feature pays for itself on the first prevented no-show.
- **Biggest risk:** Crowded market (Booksy, Squire, GlossGenius, Fresha). You win only on the cadence/rebooking + no-fees angle and on relationship distribution — this is a "better for my friends" product, not a category killer.

### 4. InvoiceEye — vendor invoice scanner and margin watchdog for food & beverage
- **Problem:** Stale costs and unverified vendor invoices silently erode restaurant/bar/liquor margins (#10); MarginEdge proves the value at $330/mo but prices out small independents.
- **Target:** Independent restaurants, bars, and liquor stores doing $500k-2M/year, currently keeping invoices in a folder.
- **Core features:** (1) Photo/email an invoice → LLM extraction of line items, prices, quantities; (2) price-change alerts vs. last purchase ("chicken thighs up 14% since March"); (3) plate-cost tracking for the 10-20 core menu items with "reprice this" flags; (4) short-delivery/credit tracking; (5) weekly cost digest.
- **Price:** $89-149/mo. Half of MarginEdge for the 20% of features small operators actually use.
- **Why you:** Restaurant owners in your network will hand you a stack of invoices on the spot — validation is instant. Findings ("you've been overpaying $340/mo since the price change you didn't catch") sell themselves.
- **Biggest risk:** Extraction accuracy on terrible carbon-copy invoices and unit-of-measure chaos (case vs. each vs. pound). Also: the insight is only as good as the owner acting on it — churn risk if they don't reprice. Scope tightly to alerts, not full accounting.

### 5. RegularsList — SMS regulars club for bars, restaurants, and liquor stores
- **Problem:** Slow nights (#12), lapsed regulars (#5), and (for liquor stores) allocation drops announced from the owner's personal phone. These businesses have loyal customers and zero infrastructure to reach them.
- **Target:** Bars, independent restaurants, liquor stores; secondary: boutiques (new-arrival drops).
- **Core features:** (1) Table-tent/QR + keyword opt-in list building; (2) one-tap broadcast ("Trivia 8pm," "Blanton's just landed — first come") with AI-drafted copy; (3) segments (bourbon list, wine list, weekday lunch crowd); (4) lapsed-visitor win-back automations tied to POS or visit check-ins; (5) simple redemption tracking to prove revenue per blast.
- **Price:** $49-99/mo + SMS usage. A liquor store selling one allocation drop via text covers a year.
- **Biggest risk:** SMS compliance (TCPA/10DLC) and list-building inertia — the product is worthless until the list hits ~200 people, so onboarding must include a list-building playbook. Competitors exist (Boostly ~$200/mo for restaurants) but sell via cold outbound, not relationships.

### 6. CaterQuote — quoting and event-costing engine for small caterers
- **Problem:** Bespoke quotes take 1-3 hours in Excel, underquoting eats margins, and nobody knows which events made money (#9).
- **Target:** 1-15 person catering companies and restaurant catering arms; Excel is the incumbent.
- **Core features:** (1) Menu/recipe library with per-portion costs; (2) quote builder: headcount + menu + staffing + travel → priced proposal PDF in minutes; (3) e-sign + deposit + payment schedule; (4) auto-scaled prep lists and shopping lists from booked menus; (5) post-event actual-vs-quoted margin report.
- **Price:** $99-179/mo. Curate charges $200-350 upmarket; small caterers will pay ~$100 to escape Excel if setup is done *for* them.
- **Why you:** Caterers overlap your restaurant and event contacts; a live "let's rebuild your last quote in 10 minutes" demo is devastatingly effective.
- **Biggest risk:** Onboarding weight — importing their recipes/pricing is the moat *and* the drag. You'll do white-glove setup for the first ten customers, which limits early velocity but locks in retention.

### 7. LeadSnap — instant inquiry responder for event & wedding vendors
- **Problem:** Speed-to-lead decides bookings; owners are mid-event when inquiries arrive; The Knot/Thumbtack fees make every lead expensive to waste.
- **Target:** DJs, planners, photo-booth, rentals, photographers, caterers (bundle with #6).
- **Core features:** (1) Unified inbox (email, website form, Knot/WeddingWire lead emails parsed); (2) AI instant response within 5 minutes asking date/venue/headcount and sharing pricing-guide link; (3) date-availability check against calendar; (4) draft proposal for owner approval; (5) follow-up sequences until booked or dead.
- **Price:** $59-99/mo. One extra booked wedding = $1,500-5,000; the math sells itself.
- **Biggest risk:** Lead-source integrations are scrapey/fragile (parsing marketplace emails), and the category is seasonal — sell in winter when they're planning, not in June when they're drowning.

### 8. ShelfSense — dead-stock and reorder analyst for liquor stores & indie retail
- **Problem:** $25-100k+ of cash trapped in non-moving inventory (#11); reordering by gut; stale POS costs.
- **Target:** Liquor stores and boutiques on Square/Clover/Lightspeed/Bottle POS with exportable sales data.
- **Core features:** (1) POS data ingestion (API where possible, CSV upload where not); (2) dead-stock report with trapped-cash dollars and markdown suggestions; (3) velocity-based reorder list by vendor; (4) margin-by-category truth report; (5) plain-English "ask your inventory" chat.
- **Price:** $79-129/mo. Framed as "I found $18k of dead cash on your shelves" — the first report is the sales pitch.
- **Biggest risk:** Data plumbing across crummy liquor POS systems is the whole job; dirty item files degrade the analysis. Start Square/Clover-only and expand. Insight-only products also churn if the owner stops looking — pair every report with one concrete action.

### 9. ShiftSOS — callout coverage and shift-swap tool for food service
- **Problem:** The 4pm callout scramble (#7). Scheduling grids exist (7shifts/Homebase); the emergency moment is still handled by frantic individual texts.
- **Target:** Independent restaurants and bars with 8-30 hourly staff; positioned as a companion, not a scheduler replacement.
- **Core features:** (1) One-tap "need coverage" blast to qualified, under-40-hours staff; (2) first-claim-wins with manager approval; (3) staff-initiated swap requests with rule checks; (4) reliability score per employee (no-show/callout history); (5) announcement channel with read receipts.
- **Price:** $49-79/mo flat. Cheap enough to buy on a handshake.
- **Biggest risk:** 7shifts/Homebase already offer swap features on paid tiers — you're betting owners want a lighter, cheaper single-purpose tool, which is plausible but means a ceiling. Rank it here because demand is real but the wedge is narrower than 1-8.

### 10. AdWeek Grocer — weekly-ad automation for independent supermarkets
- **Problem:** The weekly ad consumes a full person-day: picking deals, making the flyer, updating prices, posting everywhere (#13 applied to grocery's biggest ritual).
- **Target:** Independent/ethnic supermarkets, 1-4 stores.
- **Core features:** (1) Deal-item entry (or wholesaler deal-sheet import); (2) auto-generated print flyer PDF + social images + email + SMS from templates; (3) POS price-change export file; (4) shelf-tag print queue; (5) performance recap (ad item sell-through).
- **Price:** $199-399/mo — highest ACV on this list, justified because it replaces measurable labor hours weekly.
- **Biggest risk:** Small number of prospects locally (maybe 5-25 in a metro), heterogeneous POS systems, and design expectations for the flyer. Great business *if* your network actually includes 2-3 grocers; otherwise skip. Ranked last on market breadth, not on quality of problem.

**Portfolio note:** 1, 2, and part of 3 share a technical core (telephony + SMS + LLM + Stripe + calendar). Build that core once and you have three products for adjacent buyers. That is the strategically correct read of this entire report: **your platform is "AI answers, follows up, and collects money for businesses too busy to touch a keyboard," verticalized per category.**

---

## 90-Day Action Plan

**Primary bet: CallCatch (#1). Backup: QuoteChaser (#2)** — deliberately chosen because they share a buyer and a codebase, so validation conversations serve both and a pivot between them costs almost nothing.

### Phase 1 — Validate (Weeks 1-3)

**Week 1: Line up conversations.**
- List every service-business owner in your network (target 8-12: landscaper, cleaner, HVAC/plumbing-adjacent, auto repair, handyman). Add 2 barbers and 1 caterer as backup-idea probes.
- Book 30-minute in-person conversations. Frame honestly: "I'm building something for businesses like yours and I'll give you free use for helping me — I need to watch how you handle calls and quotes."
- Prepare a discovery script that measures, not asks opinions: *Show me your call log for last week — how many missed? What happens to a missed call? Show me the last 5 quotes you sent — how many closed? How do you follow up? How long from job done to invoice sent to money in the bank?*

**Weeks 2-3: Run 8-10 conversations. Decide.**
- For each owner, compute their number: missed calls/week × close rate × average job value. Write it down in front of them. Watch their face — that reaction is your demand signal.
- Kill criteria: if fewer than 5 of 8 owners have a missed-call number above ~$500/month *and* express willingness to try a $99/mo fix, shift weight to QuoteChaser (whose data you gathered in the same meetings).
- End every strong conversation with a real close: "If I build this in the next month, will you run it on your line for 60 days at $49/mo pilot pricing, going to $99 after?" Get 5 verbal yeses. A yes with a number attached is validation; "cool idea" is not.
- Also this week: register an LLC if you haven't, set up Stripe, and start A2P 10DLC SMS registration immediately (it takes weeks — do not let compliance delay launch later).

### Phase 2 — Build the MVP (Weeks 4-8)

**Week 4: Scope ruthlessly.** MVP = one phone number per customer, AI voice answer with per-business prompt (services, service area, hours, booking rules), booking into Google Calendar or structured message capture, SMS transcript to owner, missed-call text-back fallback, and a dead-simple weekly "calls caught / est. $ saved" email. Nothing else. No dashboard polish, no integrations, no app — SMS is the interface.

**Weeks 5-7: Build.** Stack: Twilio (voice + SMS), an LLM with realtime voice (or Vapi/Retell-style voice-agent infra to skip telephony plumbing), Stripe, a thin web admin for you, Postgres. You are one founder with AI coding agents; this is 3 weeks of focused work. Test nightly by calling it yourself with hostile inputs: mumbling, background noise, "how much for, uh, you know, the thing."

**Week 8: Friendly alpha.** Put it live on ONE owner's overflow line (rings them first, agent catches what they miss — low-risk deployment pattern). Sit in their shop for an afternoon and listen to real calls. Fix the top 5 failures. Do not onboard customer #2 until customer #1 would be upset if you took it away.

### Phase 3 — First paying pilots (Weeks 9-11)

- Convert the 5 verbal yeses: in-person setup visits, 30 minutes each, you configure everything (white-glove onboarding is your moat and your research lab). Charge from day one — $49/mo pilot rate on a card via Stripe. Free pilots produce polite users and no truth.
- Instrument the one metric: calls caught × estimated job value, delivered in a Friday SMS to each owner ("CallCatch handled 11 calls this week, booked 3 jobs, est. $1,850"). This message is simultaneously your retention engine and your referral ammunition.
- Weekly 10-minute check-in call with each pilot. Log every complaint verbatim.

### Phase 4 — Iterate and set real pricing (Weeks 12-13)

- Fix the top recurring failures; add the single most-requested feature *only if 3+ pilots asked* (likely candidates: after-hours emergency escalation, quote-request capture — the bridge to QuoteChaser).
- Pricing: move new customers to $99/mo (or $149 with the follow-up/invoicing layer), grandfather pilots at $79. Test the higher tier on the next 3 sales — in this segment, price objections come from unproven value, not the number.
- Ask each satisfied pilot the money question, face to face: "Who are two other owners who'd want this?" and — critically — "Can you text them right now to introduce me?" A warm text from a peer converts at a completely different rate than your own outreach.

### Phase 5 — Repeatable motion (Week 13 onward)

- **Referral loop:** one month free per converted referral. Home-service owners cluster at supply houses, BNI chapters, and Facebook trade groups — ask pilots which ones they attend and go with them once.
- **Category-to-category expansion:** your barber contacts get the same core product with a booking-flavored prompt (ChairBack), your caterer gets the inquiry-responder flavor. Same engine, new packaging — expand only after 10 paying service-business customers, not before.
- **Targets to hold yourself to:** Day 90 = 5-8 paying customers, ≥$500 MRR, <1 churn, and 3 warm referral intros in motion. If you have that, you have a business; double down on the same buyer before touching a second product. If pilots are churning because the agent mishandles calls, stop selling and fix quality — in a relationship-based market your reputation is the distribution channel, and it only breaks once.

**Final opinionated note:** resist the temptation to build for the categories with the most interesting problems (grocery, liquor inventory) before the categories with the most *reachable money* (service operators, barbers). The winning wedge here is boring, provable, and priced under $150/month: answer the phone, chase the quote, collect the money, refill the calendar. Everything else in this report is your expansion map for year two.
