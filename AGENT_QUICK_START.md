# Quick Start Guide for Agents

Once repositories are created, use this guide to get started.

---

## TL;DR: Which Repo Do I Clone?

| You Are | Clone This | Work Here |
|---------|-----------|-----------|
| **CEO-Agent** | `localboost-ai` | `shared/docs/` + strategic decisions |
| **Research-Agent** | `localboost-ai` + `strategic-research` | `projects/*/docs/` + competitive research |
| **Sales-Agent** | `localboost-ai` | `projects/*/DemoPlaybook.md` + pilot tracking |
| **Marketing-Agent** | `localboost-ai` | `projects/*/campaigns/` + `shared/prompts/` |

---

## Step 1: Clone Your Primary Repository

```bash
# For LocalBoost AI (most agents)
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cd localboost-ai

# For Strategic Research (design/website team)
git clone https://github.com/diaznehemiah91-svg/strategic-research.git
cd strategic-research

# For Experimental Work
git clone https://github.com/diaznehemiah91-svg/yerri-lab.git
cd yerri-lab
```

---

## Step 2: Create Your Working Branch

Follow this naming pattern:

```bash
git checkout -b claude/<project>-<agent>-<ticket>

# Examples:
git checkout -b claude/hollywood-liquors-marketing-new-campaigns
git checkout -b claude/jarvis-research-market-trends
git checkout -b claude/business-tools-sales-demo-updates
```

**Benefits**:
- Branch shows which project you're working on
- Branch shows which agent is making changes
- Easy to filter: `git branch | grep "hollywood-liquors-marketing"`

---

## Step 3: Know Your Work Folders

### CEO-Agent
```
localboost-ai/shared/docs/Roadmap.md ← You live here (monthly planning)
localboost-ai/shared/docs/ ← Strategic documentation
```

**What you do**:
1. Review monthly metrics (churn, NPS, revenue)
2. Update Roadmap.md with next 30 days
3. Approve/reject feature requests from other agents
4. Escalate blockers

**Command**: Open `shared/docs/Roadmap.md`, make edits, commit.

---

### Research-Agent
```
localboost-ai/projects/hollywood-liquors/docs/ ← Prospect briefs
localboost-ai/projects/business-tools/docs/ ← Market analysis
strategic-research/strategicresearch.com/ ← Website research (optional)
```

**What you do**:
1. Profile businesses using public data
2. Grade them (Website 0-10, Business 0-10, Marketing 0-10)
3. Find 3 demo opportunities per prospect
4. Write 1-page brief
5. Upload findings

**Commands**:
```bash
# Create prospect brief
cat > localboost-ai/projects/hollywood-liquors/docs/prospect-briefs/store-name_date.md <<'EOF'
# Prospect Brief: [Store Name]

## Grades
- Website: 6/10 (outdated, no mobile responsive)
- Business: 8/10 (solid Yelp reviews, established 15 years)
- Marketing: 2/10 (no social presence, no email list)

## 3 Opportunities
1. Build social presence (Instagram, TikTok) → $5K/month potential
2. Email marketing to existing customers → $2K/month potential
3. Optimize inventory visibility (product recommendations) → $3K/month potential

## Recommendation
HIGH-FIT for AI Growth Coach. Start with email marketing.
EOF

git add .
git commit -m "Add prospect brief for [Store Name]"
git push origin claude/hollywood-liquors-research-prospects
```

**Then**: Create PR, Sales-Agent reviews and uses for demo.

---

### Sales-Agent
```
localboost-ai/projects/hollywood-liquors/docs/DemoPlaybook.md ← Your master script
localboost-ai/projects/hollywood-liquors/docs/Objections.log ← Every "No" reason
```

**What you do**:
1. Receive prospect brief from Research-Agent
2. Customize 3-minute demo walk-through
3. Practice on phone, measure time
4. Run demo with store owner
5. Log outcome + objections
6. If yes: start pilot (define pricing)
7. If no: add to Objections.log

**Commands**:
```bash
# Update demo playbook
nano localboost-ai/projects/hollywood-liquors/docs/DemoPlaybook.md

# Log a demo outcome
cat >> localboost-ai/projects/hollywood-liquors/docs/Objections.log <<'EOF'
2026-07-11 | Hollywood Liquors (2nd & Highland) | NO | Objection: "Too expensive for small store"
EOF

git add .
git commit -m "Update demo script + log objection from Hollywood demo"
git push origin claude/hollywood-liquors-sales-demo-playbook
```

**Then**: Create PR for review, merge when ready.

---

### Marketing-Agent
```
localboost-ai/projects/hollywood-liquors/campaigns/generated/ ← Campaign outputs
localboost-ai/shared/prompts/ ← LLM prompt templates
```

**What you do**:
1. Monitor store trends (sales data, weather, calendar events)
2. Generate 4-asset campaign set (Instagram, Facebook, SMS, Email)
3. Include post times, budget, revenue lift estimate
4. Save as `generated/<store_name>_<date>.md`

**Commands**:
```bash
# Check the LLM prompt template
cat localboost-ai/shared/prompts/liquor-coach-campaigns.md

# Generate campaign (using Claude CLI):
# [Paste prompt template + fill in variables]
# Example: {STORE_NAME} = Hollywood Liquors, {CITY} = Los Angeles

# Save generated campaign
cat > localboost-ai/projects/hollywood-liquors/campaigns/generated/hollywood-liquors_2026-07-11.md <<'EOF'
# Campaign: Weekend BBQ Bundle

## Assets Generated

### 1. INSTAGRAM POST
Hot weekend coming? 🍺 Grab our BBQ Bundle—Modelo 12pk + High Noon 4pk + free ice. $29.99. Friday-Sunday while supplies last. 🔥
#HollywoodLiquors #LADrinks #WeekendPlansFTW

[Photo: Pool party scene with ice bucket and drinks]

## 2. FACEBOOK POST
It's going to be beautiful this weekend! 🌞 Stock up for your BBQ with our new Weekend Bundle — Modelo 12pk, High Noon 4pk, AND free ice for $29.99. Friday-Sunday only. Perfect for your pool party or backyard gathering. Stop by Hollywood Liquors!

## 3. SMS
Hollywood Liquors: BBQ Bundle this wknd! Modelo 12pk + High Noon 4pk + ice = $29.99. Fri-Sun. Reply STOP to opt out.

## 4. EMAIL
**Subject**: 🔥 $7 off your BBQ Bundle (this weekend only)

We know you're planning an epic weekend. Here's our shortcut: Modelo 12pk ($18) + High Noon 4pk ($11) + free ice bucket = $29.99 (save $7). Stock up Friday-Sunday at Hollywood Liquors. Come thirsty.

[CTA Button] Shop Now

---

## Post/Send Times
- Instagram: Fri 6pm, Sat 10am, Sun 12pm (pre-party, morning prep, day-of)
- Facebook: Fri 5pm, Sat 8am (organic reach peaks Fri evening, Sat morning)
- SMS: Fri 4pm (30min before happy hour) + Sat 10am (morning prep)
- Email: Fri 8am (let it sit all day, click happens Fri pm/Sat am)

## Budget Estimate
- Instagram ads: $50/day Fri-Sun (target beer buyers, 21+, within 3mi)
- Facebook ads: $30/day (broad local audience)
- Total: $240 for weekend

## Estimated Revenue Lift
- $12 profit margin per bundle, 40 bundles sold = $480 revenue
- Estimated lift: 20 bundles from campaigns = $240 gross profit
- ROI: $240 profit ÷ $80 ad spend = 3x return (70% confidence)
EOF

git add .
git commit -m "Generate weekend BBQ campaign for Hollywood Liquors"
git push origin claude/hollywood-liquors-marketing-campaigns
```

**Then**: Create PR, tag Sales-Agent (they use this for demos), merge when ready.

---

## Step 4: Make Your Changes

### Edit a File
```bash
# Open a file in your editor
nano projects/hollywood-liquors/docs/DemoPlaybook.md

# Or use your IDE
code projects/hollywood-liquors/docs/DemoPlaybook.md
```

### Create a New File
```bash
# Create prospect brief
mkdir -p projects/hollywood-liquors/docs/prospect-briefs
touch projects/hollywood-liquors/docs/prospect-briefs/template.md
```

### View Changes Before Committing
```bash
git status                  # See what changed
git diff                    # See exact changes
git diff --stat             # Summary of changes
```

---

## Step 5: Commit Your Changes

```bash
# Stage your changes
git add projects/hollywood-liquors/docs/DemoPlaybook.md
# or all changes:
git add .

# Write a clear commit message
git commit -m "Update demo script to include SMS campaign slide"

# If you made a mistake:
git commit --amend          # Fix last commit message
```

**Commit Message Template**:
```
[PROJECT] Brief description of change

- Specific change 1
- Specific change 2

Related to: #issue-number (if applicable)
```

**Example**:
```
[Hollywood Liquors] Add SMS campaign slide to demo script

- Added slide 5: "Mobile reach (SMS)" with opt-out language
- Updated compliance checklist
- Tested script timing (now 2:55, goal <3:00)

Related to: #42
```

---

## Step 6: Push Your Branch

```bash
# First time pushing this branch
git push -u origin claude/hollywood-liquors-marketing-campaigns

# Subsequent pushes
git push

# If push fails (network hiccup), retry:
git push -u origin claude/hollywood-liquors-marketing-campaigns
# Try again after 2s if timeout
```

---

## Step 7: Open a Pull Request

On GitHub:
1. Go to https://github.com/diaznehemiah91-svg/localboost-ai
2. Click "Compare & pull request" (should appear after push)
3. Fill in:
   - **Title**: Describe what you did (≤70 chars)
   - **Description**: Why you made this change, what it impacts
   - **Reviewers**: Tag relevant agents (e.g., `@Sales-Agent`)

**Example PR**:
```
Title: Generate weekend BBQ campaign for Hollywood Liquors

Description:
## Campaign
- Weekend BBQ Bundle promotion
- Triggered by: Sunny forecast (88°F, Fri-Sun) + Modelo +25% sales this week

## Assets
- Instagram post (3-5 lines, local hashtags)
- Facebook post (warm, neighborly tone)
- SMS (160 chars with opt-out)
- Email (subject + body)

## Timeline
- Post Friday 6pm + Saturday 10am + Sunday 12pm
- SMS Friday 4pm + Saturday 10am (just before shopping time)

## ROI Estimate
- $240 ad spend → $240 gross profit (20 additional bundles)
- 3x return, 70% confidence

Closes #42
```

**Reviewers**: Link to Sales-Agent PR comment so they can use campaign immediately.

---

## Common Workflows

### Workflow 1: Update Demo Script (Sales-Agent)

```bash
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cd localboost-ai
git checkout -b claude/hollywood-liquors-sales-demo-updates

# Edit the script
nano projects/hollywood-liquors/docs/DemoPlaybook.md

# Test it (imagine you're a store owner reading this)
# Does it take <3 minutes?
# Is the value clear?

# Commit
git add projects/hollywood-liquors/docs/DemoPlaybook.md
git commit -m "Add SMS slide to demo + update timing notes"

# Push
git push -u origin claude/hollywood-liquors-sales-demo-updates

# Open PR on GitHub
# Tag: Marketing-Agent (use for campaigns)
# Tag: CEO-Agent (for strategic review)
```

---

### Workflow 2: Profile a Prospect (Research-Agent)

```bash
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cd localboost-ai
git checkout -b claude/hollywood-liquors-research-prospects

# Create prospect brief
cat > projects/hollywood-liquors/docs/prospect-briefs/hollywood-liquors-main_2026-07-11.md <<'EOF'
# Prospect Brief: Hollywood Liquors (Main Location)

[Your research findings...]
EOF

# Commit
git add projects/hollywood-liquors/docs/prospect-briefs/
git commit -m "Add prospect brief for Hollywood Liquors (Main)"

# Push
git push -u origin claude/hollywood-liquors-research-prospects

# Open PR on GitHub
# Tag: Sales-Agent (use for demos)
```

---

### Workflow 3: Generate Campaign (Marketing-Agent)

```bash
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cd localboost-ai
git checkout -b claude/hollywood-liquors-marketing-weekend-promo

# Use LLM to generate campaign
# (Use the prompt template from shared/prompts/liquor-coach-campaigns.md)

# Save output
cat > projects/hollywood-liquors/campaigns/generated/hollywood-liquors_2026-07-11.md <<'EOF'
[Campaign assets...]
EOF

# Commit
git add projects/hollywood-liquors/campaigns/generated/
git commit -m "Generate weekend BBQ campaign for Hollywood Liquors"

# Push
git push -u origin claude/hollywood-liquors-marketing-weekend-promo

# Open PR on GitHub
# Tag: Sales-Agent (for demo usage)
```

---

## If Something Goes Wrong

### I committed to the wrong branch
```bash
git reset HEAD~1                    # Undo last commit, keep changes
git checkout -b claude/correct-branch-name
git commit -m "Fix: commit to correct branch"
```

### I need to pull latest changes from main
```bash
git fetch origin                    # Get latest from GitHub
git rebase origin/main              # Replay my changes on top
git push -f origin claude/my-branch # Force push (use carefully!)
```

### I want to see what changed
```bash
git diff origin/main               # See differences from main
git log --oneline -10              # See last 10 commits
git show <commit-hash>             # See specific commit
```

### I need help
1. Check `ORGANIZATION.md` in the repo
2. Search GitHub issues for similar problems
3. Ask in a GitHub discussion or issue

---

## Folder Structure Reminder

```
localboost-ai/                      ← You're in this repo
├── projects/
│   ├── jarvis/                     ← Market intelligence (CEO/Research/Sales)
│   ├── hollywood-liquors/          ← AI Growth Coach (Research/Sales/Marketing)
│   │   ├── campaigns/generated/    ← Your campaign outputs (Marketing-Agent)
│   │   ├── docs/
│   │   │   ├── DemoPlaybook.md    ← Your script (Sales-Agent)
│   │   │   └── prospect-briefs/   ← Your research (Research-Agent)
│   │   └── prompts/               ← LLM templates (Marketing-Agent)
│   ├── webull-integration/         ← Broker API (Research/Sales/Marketing)
│   └── business-tools/             ← Market research tools (Research/Marketing)
│
├── shared/
│   ├── docs/
│   │   ├── Roadmap.md             ← Strategic direction (CEO-Agent)
│   │   └── DemoPlaybook.md         ← Shared demo template
│   ├── agents/                     ← Agent job descriptions
│   └── prompts/                    ← Reusable LLM prompts
│
└── README.md                       ← Project overview
```

---

## Command Cheat Sheet

```bash
# Setup
git clone <repo-url>
cd <repo-name>
git checkout -b claude/<project>-<agent>-<ticket>

# Work
nano filename                       # Edit file
git status                          # See changes
git diff                            # See exact changes
git add .                           # Stage all changes
git commit -m "Message"             # Create commit

# Share
git push -u origin <branch>         # Push (first time)
git push                            # Push (subsequent)

# Update
git fetch origin                    # Get latest
git rebase origin/main              # Apply latest to your branch
git pull origin <branch>            # Pull specific branch

# Undo
git reset HEAD~1                    # Undo last commit
git checkout -- filename            # Discard changes to file
```

---

## Next Steps

1. **Clone your primary repo** (see Step 1)
2. **Create your working branch** (see Step 2)
3. **Know your work folders** (see Step 3)
4. **Make your changes** (see Step 4-5)
5. **Push and open PR** (see Step 6-7)
6. **Reference ORGANIZATION.md for decisions** (when unsure)

---

**Ready to start?** Choose your agent role above and clone your repo!
