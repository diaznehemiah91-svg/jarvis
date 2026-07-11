# Repository Organization & Agent Assignment

**Status**: Preparation layer for independent agent workflow  
**Last Updated**: 2026-07-11

This document defines your multi-repository structure and which agents own which projects.

---

## Repository Structure (Target State)

### 1. **localboost-ai** (Primary Business Repository)
**Purpose**: Container for all AI-powered business and market intelligence tools  
**GitHub**: `diaznehemiah91-svg/localboost-ai`  
**Primary Agents**: CEO-Agent, Research-Agent, Sales-Agent, Marketing-Agent

#### Projects within this repo:
- **jarvis/** — AI-powered market intelligence and trading dashboard (Finnhub data, TradingView charts, breaking news)
- **hollywood-liquors/** — AI Growth Coach for liquor store optimization (daily recommendations, campaigns, trends)
- **webull-integration/** — WebBull broker API integration and watchlist management
- **business-tools/** — Shared tools for business creation, market research, prospect profiling
- **localboost-ai/** — Reusable starter kit (agents, prompts, demo templates)

#### Folder Structure:
```
localboost-ai/
├── README.md (project overview)
├── CLAUDE.md (agent skills & CLI config)
├── CONTRIBUTING.md (onboarding for agents)
├── package.json / requirements.txt (shared dependencies)
│
├── projects/
│   ├── jarvis/
│   │   ├── README.md
│   │   ├── engine/ (Python backend: auth, features, trading)
│   │   ├── www/ (Frontend: dashboard, pages, styles)
│   │   └── AGENT_JARVIS.md (agent assignment for Jarvis)
│   │
│   ├── hollywood-liquors/
│   │   ├── README.md
│   │   ├── demos/hollywood-liquors/index.html (AI Growth Coach demo)
│   │   ├── docs/
│   │   ├── agents/
│   │   ├── prompts/
│   │   └── AGENT_HOLLYWOOD.md (agent assignment)
│   │
│   ├── webull-integration/
│   │   ├── README.md
│   │   ├── api/ (WebBull broker API)
│   │   ├── features/ (watchlist, holdings, orders)
│   │   └── AGENT_WEBULL.md (agent assignment)
│   │
│   └── business-tools/
│       ├── README.md
│       ├── prospect-research/
│       ├── market-analysis/
│       └── AGENT_BUSINESS.md (agent assignment)
│
├── shared/
│   ├── agents/ (4 core agents: CEO, Research, Sales, Marketing)
│   ├── prompts/ (reusable LLM prompts)
│   ├── templates/ (campaign, demo, analysis templates)
│   └── docs/ (roadmap, playbooks, guidelines)
│
└── .github/
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/ (CI/CD for all projects)
```

---

### 2. **strategic-research** (Isolated Repository)
**Purpose**: Strategic Research website and brand  
**GitHub**: `diaznehemiah91-svg/strategic-research`  
**Primary Agents**: Dedicated website builders/designers  
**Projects**: strategicresearch.com, strategicresearch.ai

#### Folder Structure:
```
strategic-research/
├── README.md
├── CLAUDE.md
├── .github/workflows/ (build & deploy)
│
├── strategicresearch.com/
│   ├── index.html
│   ├── assets/
│   ├── css/
│   └── js/
│
└── strategicresearch.ai/
    ├── index.html
    ├── assets/
    ├── css/
    └── js/
```

---

### 3. **prompt-library** (Optional: Shared Resources)
**Purpose**: Centralized, versioned prompt templates used across all projects  
**GitHub**: `diaznehemiah91-svg/prompt-library`  
**Consumers**: All agents (via git submodule or import)

```
prompt-library/
├── README.md
├── growth-coach/ (liquor store, retail, etc.)
├── market-research/ (prospect analysis)
├── campaign-generation/ (marketing assets)
├── trading-analysis/ (market intelligence)
└── VERSION.md (semantic versioning for prompt changes)
```

---

### 4. **yerri-lab** (Optional: Experimental)
**Purpose**: Prototypes, MVPs, and experimental projects  
**GitHub**: `diaznehemiah91-svg/yerri-lab`  
**Status**: Low priority; use during R&D phases

---

## Current Folder Layout (Preparation Layer)

Until repositories can be created, work is organized within `/home/user/jarvis/` with this structure:

```
jarvis/                           # Main working directory
│
├── localboost-ai/                # READY TO MIGRATE → new localboost-ai repo
│   ├── projects/
│   │   ├── hollywood-liquors/    (AI Growth Coach demo + docs)
│   │   ├── jarvis-core/          (trading dashboard + engine)
│   │   └── webull-integration/   (broker API)
│   ├── shared/
│   │   ├── agents/
│   │   ├── prompts/
│   │   └── docs/
│   └── README.md
│
├── strategic-research-staging/   # READY TO MIGRATE → new strategic-research repo
│   ├── strategicresearch.com/
│   └── strategicresearch.ai/
│
└── [existing]
    ├── engine/                   # → moves to localboost-ai/projects/jarvis/
    ├── www/                      # → moves to localboost-ai/projects/jarvis/
    └── v4/                       # → archive or move to yerri-lab/
```

---

## Agent Assignments & Workflows

### CEO-Agent (Project Leadership)
**Owns**: Strategic direction, roadmap prioritization, resource allocation  
**Primary Repo**: `localboost-ai`  
**Responsibilities**:
- Maintain `/shared/docs/Roadmap.md` for all projects
- Prioritize features ruthlessly ("which paying customer does this get us closer to?")
- Review and approve major PRs from other agents
- Sync with Sales-Agent on close rates and pilot feedback

**When to Collaborate**:
- With Research-Agent: Scoping new opportunities
- With Marketing-Agent: Campaign ROI analysis
- With Sales-Agent: Pilot pricing and close rates

---

### Research-Agent (Prospect & Market Intelligence)
**Owns**: Prospect profiling, market analysis, competitive research  
**Primary Repos**: `localboost-ai` (hollywood-liquors, business-tools), `strategic-research`  
**Responsibilities**:
- Profile prospects using public information (website, social, reviews)
- Grade businesses (Website/Business/Marketing scores out of 10)
- Identify 3 demo opportunities per prospect
- Track competitor strategies and pricing
- Document findings in prospect briefs (1 page, <1 hour each)
- **File locations**: `projects/*/docs/prospect-briefs/`, `projects/business-tools/`

**When to Collaborate**:
- With Sales-Agent: Share prospect briefs before demos
- With Marketing-Agent: Share competitor campaign intelligence
- With CEO-Agent: Flag high-value opportunities for prioritization

---

### Sales-Agent (Demos & Closures)
**Owns**: Demo scripts, pilot framing, objection handling  
**Primary Repo**: `localboost-ai`  
**Responsibilities**:
- Maintain and evolve `/shared/docs/DemoPlaybook.md`
- Personalize demos from Research-Agent briefs
- Define pilot pricing ($X/month, 60-day money-back guarantee)
- Log every objection and demo outcome in structured format
- Close with: *"Pilot price, month to month, cancel anytime. If it doesn't visibly make you money in 60 days, you shouldn't keep it."*
- **File locations**: `projects/*/docs/DemoPlaybook.md`, `projects/*/docs/Objections.log`

**Success Metrics**:
- Every demo takes <3 minutes on a phone
- Every demo ends with a concrete next step (follow-up booked or pilot started)
- Pitch passes the test: Would a busy store owner see the money in 60 seconds?

**When to Collaborate**:
- With Research-Agent: Get prospect brief before each demo
- With Marketing-Agent: Use campaign data to anchor demo (e.g., "Modelo sales +25% this week")
- With CEO-Agent: Escalate promising pilots for priority support

---

### Marketing-Agent (Campaign Generation)
**Owns**: Content creation, campaign assets, posting schedules, budget optimization  
**Primary Repos**: `localboost-ai`, `prompt-library`  
**Responsibilities**:
- Generate 4-asset campaign sets (Instagram, Facebook, SMS, Email)
- Anchor every campaign to a reason (trend, weather, holiday, customer segment)
- Maintain and evolve `/shared/prompts/liquor-coach-campaigns.md`
- Always include estimated lift + confidence (e.g., "+8% revenue, 75% confidence")
- Ensure SMS ≤160 chars with opt-out language
- Compliance: No content targeting minors; include "drink responsibly" framing
- **File locations**: `projects/*/campaigns/`, `shared/prompts/`

**Success Metrics**:
- Full campaign set generates in one pass with no manual fixing
- SMS always fits 160 chars with opt-out
- Compliance: no minors targeting, drink-responsibly framing included

**When to Collaborate**:
- With Research-Agent: Get competitor intelligence and market trends
- With Sales-Agent: Use demo data to fuel campaign ideas
- With CEO-Agent: Report campaign ROI and recommend budget allocation

---

## How Agents Work on Different Projects

### Same Repository, Different Folders
When multiple agents work on projects within **localboost-ai**:

```
Agent A (Research) → localboost-ai/projects/hollywood-liquors/docs/
Agent B (Marketing) → localboost-ai/projects/hollywood-liquors/campaigns/
Agent C (Sales) → localboost-ai/projects/hollywood-liquors/DemoPlaybook.md
```

**No merge conflicts** because each agent has:
1. A primary folder they own (Research owns `docs/`, Marketing owns `campaigns/`, etc.)
2. Clear branch naming: `claude/hollywood-liquors-research-<ticket>`, `claude/hollywood-liquors-marketing-<ticket>`
3. Non-overlapping file edits

### Isolated Repository (strategic-research)
When only one agent (or a small team) works on a project:

```
strategic-research repo (isolated)
→ Single agent owns entire repo
→ No branch coordination needed
```

### Cross-Project Collaboration
When agents need to sync (e.g., Marketing needs Competitor Intelligence from Research):

```
Research-Agent commits to: localboost-ai/projects/business-tools/competitive-intel/
Marketing-Agent reads from: localboost-ai/projects/business-tools/competitive-intel/
↓
No merge conflicts: Research writes, Marketing reads
↓
If Marketing needs revisions: GitHub issue in localboost-ai, Research-Agent picks it up
```

---

## Branch Naming Convention

All development work follows this pattern:

```
claude/<project>-<agent>-<ticket>

Examples:
- claude/hollywood-liquors-marketing-new-campaigns-abc123
- claude/jarvis-research-prospect-scoring-def456
- claude/strategic-research-design-homepage-ghi789
```

**Benefits**:
- Agents can filter branches by their project: `claude/hollywood-liquors-*`
- Easy to identify agent ownership
- Clear relationship to work ticket
- Prevents accidental overwrites

---

## Migration Checklist (When Repos Are Created)

### Phase 1: Create Repositories (Manual Step)
- [ ] Create `localboost-ai` repo (primary business repo)
- [ ] Create `strategic-research` repo (isolated website)
- [ ] (Optional) Create `prompt-library` repo (shared resources)
- [ ] (Optional) Create `yerri-lab` repo (experimental)

### Phase 2: Migrate Code (Automated Script Available)
**Once repos exist, run migration script** (see `MIGRATION.md`):
```bash
# Example (manual process for now)
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cp -r jarvis/localboost-ai/projects/* localboost-ai/projects/
cp -r jarvis/engine localboost-ai/projects/jarvis/
cp -r jarvis/www localboost-ai/projects/jarvis/
cd localboost-ai && git add . && git commit -m "Initial migration from jarvis repo"
git push origin main
```

### Phase 3: Update CLAUDE.md in Each Repo
Each new repo needs its own `.claude/config.yaml` or `CLAUDE.md` with:
- Agent assignments for that repo
- Key skills and tool access
- Primary work directories
- Collaboration guidelines

### Phase 4: Set Up GitHub Projects (Optional)
Create GitHub Projects for cross-repo coordination:
- **LocalBoost AI** project: Track all features/bugs across all sub-projects
- **Strategic Research** project: Track website feature/content backlog

---

## Immediate Next Steps

1. **Prepare localboost-ai folder structure** (DONE - ready to migrate)
2. **Create AGENT_*.md files** for each project (in progress)
3. **Document migration scripts** (see MIGRATION.md)
4. **Set up branch naming convention** (GitHub settings)
5. **Request repository creation** (manual step with broader GitHub permissions)
6. **Execute migration** (once repos exist)
7. **Update CLAUDE.md in each repo** (post-migration setup)

---

## FAQ

**Q: Can agents work on overlapping files?**  
A: No. Each agent has a primary folder they own. Use GitHub issues for cross-folder changes.

**Q: How do I know which agent to escalate to?**  
A: See "Agent Assignments" section above. CEO-Agent arbitrates conflicts.

**Q: What if I need to create a new project?**  
A: 1) Create folder in appropriate repo, 2) Add README.md, 3) Assign primary agent, 4) Create GitHub issue, 5) Agent takes ownership.

**Q: Can I work on multiple projects at once?**  
A: Yes, but use separate branches for each. Branch naming includes project name.

**Q: How do we handle urgent vs. planned work?**  
A: CEO-Agent prioritizes via roadmap. Sales-Agent can escalate pilot blockers to CEO-Agent for immediate support.

---

## References

- **Roadmap**: `/shared/docs/Roadmap.md` (CEO-Agent owns)
- **DemoPlaybook**: `/projects/hollywood-liquors/docs/DemoPlaybook.md` (Sales-Agent owns)
- **Prompt Templates**: `/shared/prompts/` (Marketing-Agent owns)
- **Prompt Library**: (future repo)

---

**Questions?** Contact CEO-Agent for clarification or escalation.
