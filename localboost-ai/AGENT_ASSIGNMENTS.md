# Agent Assignments for LocalBoost AI

This document maps agents to projects and defines ownership within the localboost-ai repository.

---

## Quick Reference

| Agent | Primary Repos | Primary Projects | Work Folders |
|-------|--------------|------------------|--------------|
| **CEO-Agent** | localboost-ai | All (strategic oversight) | `/shared/docs/`, roadmap decisions |
| **Research-Agent** | localboost-ai, strategic-research | hollywood-liquors, business-tools | `/projects/*/docs/`, competitive intel |
| **Sales-Agent** | localboost-ai | hollywood-liquors, business-tools | `/projects/*/DemoPlaybook.md`, objections |
| **Marketing-Agent** | localboost-ai, prompt-library | hollywood-liquors, business-tools | `/projects/*/campaigns/`, `/shared/prompts/` |

---

## Project: Jarvis (Market Intelligence Dashboard)

**Owner**: CEO-Agent (strategic), Research-Agent (data), Sales-Agent (demo)  
**Status**: Active, in production  
**Path**: `projects/jarvis/`

### Folder Structure
```
projects/jarvis/
├── engine/                          # Python backend
│   ├── auth/
│   ├── trading/
│   ├── features.py
│   ├── config.py
│   └── requirements.txt
│
├── www/                             # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   └── assets/
│
├── docs/                            # Project documentation
│   ├── API.md
│   ├── Architecture.md
│   └── Roadmap.md
│
└── README.md                        # Project overview
```

### Agent Responsibilities

#### CEO-Agent
- Set strategic priorities (which markets, which data sources)
- Decide whether to integrate new APIs (Finnhub, Polygon, etc.)
- Approve major architecture changes
- Own `docs/Roadmap.md` — decide what ships next

#### Research-Agent
- Profile market trends
- Analyze competitor dashboards (TradingView, Finviz, etc.)
- Identify gaps in current Jarvis feature set
- Document feature opportunities in `docs/Opportunities.md`

#### Sales-Agent
- Demo Jarvis to prospective traders/fund managers
- Maintain `docs/DemoPlaybook.md` with walk-through script
- Log objections: "Can't connect to Interactive Brokers", "Missing options chain", etc.
- File issues for high-frequency objections

### Key Files Agents Edit

| File | Owner | What | How Often |
|------|-------|------|-----------|
| `docs/Roadmap.md` | CEO-Agent | What ships in next 30 days | Monthly |
| `docs/DemoPlaybook.md` | Sales-Agent | 3-minute walk-through script | Per demo update |
| `docs/Opportunities.md` | Research-Agent | Feature ideas, market gaps | Weekly |
| `engine/features.py` | Developer (assigned by CEO) | Implementation | Per sprint |
| `www/index.html` | Developer (assigned by CEO) | UI/UX | Per sprint |

### Branch Naming
```
claude/jarvis-sales-demo-updates-<date>
claude/jarvis-research-market-analysis-<date>
claude/jarvis-ceo-roadmap-q3-planning
```

### No Conflicts
- **CEO-Agent** writes roadmap, research reads it
- **Research-Agent** writes opportunities, CEO reads & prioritizes
- **Sales-Agent** writes playbook, others don't edit
- Developers assigned by CEO never edit roadmap/playbook/opportunities

---

## Project: Hollywood Liquors (AI Growth Coach)

**Owner**: Sales-Agent (pilot sales), Marketing-Agent (campaigns), Research-Agent (prospect research)  
**Status**: MVP complete, pilots in progress  
**Path**: `projects/hollywood-liquors/`

### Folder Structure
```
projects/hollywood-liquors/
├── demos/
│   └── hollywood-liquors/
│       └── index.html                # AI Growth Coach web app (2000+ lines, all-in-one)
│
├── docs/
│   ├── DemoPlaybook.md              # Sales script for liquor store owners
│   ├── Objections.log               # Logged objections from demos
│   ├── Roadmap.md                   # 30-day V1 roadmap
│   └── TechStack.md                 # Zero external dependencies, single-file design
│
├── campaigns/
│   ├── templates/
│   │   ├── weekend-bbq.md           # Example campaign set
│   │   ├── happy-hour.md
│   │   └── holiday-promo.md
│   └── generated/
│       └── <store_name>_<date>.md   # Generated campaign outputs
│
├── agents/
│   ├── CEO-Agent.md
│   ├── Research-Agent.md
│   ├── Sales-Agent.md
│   └── Marketing-Agent.md
│
├── prompts/
│   ├── growth-coach-chat.md         # System prompt for coach persona
│   └── liquor-coach-campaigns.md    # LLM template for 4-asset generation
│
└── README.md
```

### Agent Responsibilities

#### Research-Agent
**Primary Focus**: Prospect profiling for liquor store owners
- **Files**: `docs/Opportunities.md`, prospect brief templates
- **Workflow**:
  1. Find target liquor stores in a region (Google Maps, Yelp, Instagram)
  2. Grade each: Website (0-10), Business presence (0-10), Marketing (0-10)
  3. Identify 3 demo opportunities (e.g., "No social presence", "Stale website", "Untapped email list")
  4. Document in 1-page prospect brief
  5. Tag "high-fit" prospects for Sales-Agent to target
- **Output**: `docs/prospect-briefs/<store_name>_<date>.md`
- **Success Metric**: Each brief takes <1 hour, directly feeds personalized demo

**When to Collaborate**:
- With Sales-Agent: Share brief before each demo
- With Marketing-Agent: Flag competitor campaigns (what are other stores promoting?)
- With CEO-Agent: Highlight regional clusters (e.g., "20 liquor stores in Hollywood")

#### Sales-Agent
**Primary Focus**: Demo scripts, pilot framing, objection handling
- **Files**: `docs/DemoPlaybook.md`, `docs/Objections.log`
- **Workflow**:
  1. Receive prospect brief from Research-Agent
  2. Customize 3-minute demo walk-through (10 slides max, phone-first)
  3. Practice on iPhone/Android, measure time
  4. Run demo with store owner
  5. Log outcome: Yes → schedule pilot, No → log objection
  6. If pilot starts: define pricing ($X/month, 60-day money-back)
  7. Track pilot results for upsell/churn prediction
- **Output**: `docs/DemoPlaybook.md` (master script), `docs/Objections.log` (per-store notes)
- **Success Metrics**:
  - Demo runs in <3 minutes on a phone
  - Every demo ends with a concrete next step
  - Pitch passes: "Would a busy store owner see the money in 60 seconds?"
  - Close rate ≥ 30% of demos → pilot

**When to Collaborate**:
- With Research-Agent: Get prospect brief before each demo
- With Marketing-Agent: Use recent campaign data to anchor demo value
- With CEO-Agent: Escalate promising pilots for priority support

#### Marketing-Agent
**Primary Focus**: Campaign generation and optimization
- **Files**: `campaigns/generated/`, `prompts/liquor-coach-campaigns.md`
- **Workflow**:
  1. Monitor store trends (Modelo +25%, weather forecast 88°F, Saturday ahead)
  2. Generate 4-asset campaign set:
     - Instagram post (3-5 lines, 1-2 emoji/line, local hashtags)
     - Facebook post (2-3 sentences, warm/neighborly)
     - SMS (≤160 chars with "Reply STOP to opt out")
     - Email (subject ≤45 chars, body 60-110 words)
  3. Include post/send times + reasons
  4. Estimate revenue lift range + confidence level
  5. Document ad budget suggestion (if applicable)
  6. File as `campaigns/generated/<store_name>_<date>.md`
- **Output**: Complete campaign sets, ready to use
- **Success Metrics**:
  - Full campaign set generates in one pass (no manual fixing)
  - SMS always fits 160 chars with opt-out
  - Compliance: no minors targeting, "drink responsibly" on paid placements
  - Estimated lift is defensible (not guessing)

**When to Collaborate**:
- With Research-Agent: Get competitor campaign intel
- With Sales-Agent: Use demo feedback to improve campaign angle
- With CEO-Agent: Report campaign ROI, request budget reallocation

#### CEO-Agent
**Primary Focus**: Strategic direction and prioritization
- **Files**: `docs/Roadmap.md`, decision-making on features
- **Workflow**:
  1. Review pilot data monthly: churn rate, NPS, revenue impact
  2. Decide: expand to new cities? add features? adjust pricing?
  3. Prioritize ruthlessly: "Which paying customer does this get us closer to?"
  4. Approve or reject feature requests from other agents
  5. Escalate blockers (e.g., "Can't get SMS compliance right")
  6. Plan next 30-day sprint
- **Output**: `docs/Roadmap.md` (updated monthly)
- **Key Decision**: When do we graduate Hollywood Liquors from MVP to production?

### Key Files Agents Edit

| File | Owner | What | How Often |
|------|-------|------|-----------|
| `docs/DemoPlaybook.md` | Sales-Agent | 3-min walk-through script | Per demo iteration |
| `docs/Objections.log` | Sales-Agent | Every "No" from a demo | Per demo |
| `docs/Roadmap.md` | CEO-Agent | What ships next | Monthly |
| `campaigns/generated/*` | Marketing-Agent | Generated campaign sets | Per campaign |
| `prompts/liquor-coach-campaigns.md` | Marketing-Agent | LLM template | When prompts improve |
| `demos/hollywood-liquors/index.html` | Developer (CEO assigns) | App code | Per sprint |

### Branch Naming
```
claude/hollywood-liquors-sales-demo-playbook-<date>
claude/hollywood-liquors-marketing-campaigns-<date>
claude/hollywood-liquors-research-prospects-<region>
claude/hollywood-liquors-ceo-roadmap-<sprint>
```

### No Conflicts
- **Sales-Agent** owns `docs/DemoPlaybook.md`, others read
- **Marketing-Agent** owns `campaigns/` folder, others read
- **Research-Agent** owns prospect brief outputs, others read
- **CEO-Agent** owns roadmap, all agents read
- Developers write to app code, agents read from app

---

## Project: WebBull Integration

**Owner**: Research-Agent (competitor research), Sales-Agent (feature demo), CEO-Agent (priority)  
**Status**: Planning  
**Path**: `projects/webull-integration/`

### Responsibilities
- Research: Analyze WebBull's broker API and competitor integrations
- Sales: Demo WebBull features to prospective users
- Marketing: Generate tutorials/guides for WebBull users
- CEO: Decide scope (Options only? Equities? Crypto?)

### Key Files
| File | Owner |
|------|-------|
| `docs/Roadmap.md` | CEO-Agent |
| `api/webull-client.py` | Developer (CEO assigns) |
| `docs/FeatureDemo.md` | Sales-Agent |

---

## Project: Business Tools

**Owner**: Research-Agent (prospect research), Marketing-Agent (content generation)  
**Status**: Planning  
**Path**: `projects/business-tools/`

### Responsibilities
- Research: Profile businesses using public data
- Marketing: Generate market intelligence reports
- CEO: Decide which tools to build first

### Key Files
| File | Owner |
|------|-------|
| `docs/Roadmap.md` | CEO-Agent |
| `prospect-research/templates/` | Research-Agent |
| `market-analysis/` | Marketing-Agent |

---

## Shared Resources (All Agents)

**Path**: `shared/`

### shared/agents/
Owned by: CEO-Agent  
Contains: Full job descriptions for each agent (CEO, Research, Sales, Marketing)  
Updated: Quarterly or when roles change

### shared/prompts/
Owned by: Marketing-Agent (primary), CEO-Agent (approval)  
Contains: Reusable LLM prompts  
- `growth-coach-chat.md` — System prompt for coach persona
- `liquor-coach-campaigns.md` — Campaign generation template
- (Expandable for other prompts)

Updated: When prompts improve significantly

### shared/docs/
Owned by: CEO-Agent  
Contains:
- `Roadmap.md` — Overall 30-day plan
- `DemoPlaybook.md` — Master demo template
- `Objections.log` — Aggregate of all objections across projects

---

## Collaboration Workflow: When Agents Need Input

### Scenario 1: Marketing Needs Competitor Intel
```
Marketing-Agent asks in GitHub issue:
"What campaigns are running at Hollywood Liquor in LA right now?"

Research-Agent responds:
- Checks Google/Instagram/Facebook
- Shares findings in issue comment
- Closes issue

No merge conflicts, minimal back-and-forth
```

### Scenario 2: CEO Needs Sales Data
```
CEO-Agent creates GitHub discussion:
"How many demo-to-pilot conversions did we get in June?"

Sales-Agent responds:
- Pulls from Objections.log
- Summarizes: "12 demos, 4 pilots (33% close rate)"
- Provides feedback

CEO updates Roadmap based on findings
```

### Scenario 3: Marketing Wants to Update Demo Playbook
```
Marketing-Agent suggests change:
"The current demo script doesn't mention SMS campaigns.
Can we add a slide?"

Sales-Agent decides:
- If yes: updates docs/DemoPlaybook.md in their branch
- If no: explains why in issue comment

Only Sales-Agent commits to DemoPlaybook.md
```

---

## Decision Escalation

### Small Changes (Each Agent Can Do Alone)
- Sales-Agent: Update DemoPlaybook.md script
- Marketing-Agent: Generate new campaign
- Research-Agent: Profile new prospect

### Medium Changes (Needs 1 Other Agent's Input)
- Change demo script AND campaign together → Sales-Agent + Marketing-Agent discuss
- Add new feature AND update roadmap → Developer + CEO-Agent discuss
- New prospect type AND new campaign → Research-Agent + Marketing-Agent discuss

### Large Changes (Needs CEO-Agent Approval)
- Pivot to new target customer type
- Change pricing model
- Enter new market or vertical
- Add major new feature (e.g., "SMS automation")

→ Create GitHub issue, tag CEO-Agent, wait for decision

---

## Review Checklist (Before PR Merge)

✓ **Code Quality**
- [ ] No external dependencies added (unless approved by CEO)
- [ ] Single-file design maintained for demos
- [ ] Zero secrets in commit (no API keys, tokens)

✓ **Documentation**
- [ ] Affected README.md updated
- [ ] Comments explain WHY (not WHAT)
- [ ] Changes logged in relevant .log or tracking file

✓ **Compliance** (Hollywood Liquors specific)
- [ ] No content targeting minors
- [ ] SMS includes "Reply STOP to opt out"
- [ ] Campaign includes "drink responsibly" framing
- [ ] No pricing below state minimums

✓ **Collaboration**
- [ ] Related agents notified in issue/PR comments
- [ ] CEO-Agent alerted if scope changed
- [ ] No conflicting edits to shared files

---

## Contact & Escalation

| Topic | Contact | Method |
|-------|---------|--------|
| Strategic decision | CEO-Agent | GitHub issue (tag `@CEO`) |
| Demo playbook update | Sales-Agent | GitHub PR to DemoPlaybook.md |
| Campaign generation | Marketing-Agent | GitHub PR to campaigns/ |
| Prospect research | Research-Agent | GitHub PR + issue comment |
| Cross-project conflict | CEO-Agent | GitHub discussion |

---

**Questions?** See main [ORGANIZATION.md](../ORGANIZATION.md) document.
