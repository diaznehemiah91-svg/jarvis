# Repository Migration Guide

**Timeline**: When GitHub repository creation is approved  
**Complexity**: Medium (involves code reorganization, git history preservation)

---

## Pre-Migration Checklist

- [ ] All GitHub repos created and initialized
- [ ] Collaborators added to each repo
- [ ] GitHub Projects set up (optional)
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` drafted for each repo
- [ ] Confirm all agents have GitHub access

---

## Migration Plan

### Step 1: Create localboost-ai Repository (Primary Business Repo)

```bash
# Create repo on GitHub (manual step)
# https://github.com/new
# - Owner: diaznehemiah91-svg
# - Repository name: localboost-ai
# - Description: AI-powered market intelligence & business optimization tools
# - Public
# - Add README, .gitignore (node, python), MIT license

# Clone locally
git clone https://github.com/diaznehemiah91-svg/localboost-ai.git
cd localboost-ai

# Set up folder structure
mkdir -p projects/{jarvis,hollywood-liquors,webull-integration,business-tools}
mkdir -p shared/{agents,prompts,templates,docs}
mkdir -p .github/{ISSUE_TEMPLATE,workflows}

# Copy files from jarvis repo
cp -r /home/user/jarvis/engine projects/jarvis/
cp -r /home/user/jarvis/www projects/jarvis/
cp -r /home/user/jarvis/v4 projects/jarvis/v4-archive/

# Copy LocalBoost AI starter kit
cp -r /home/user/jarvis/localboost-ai/demos projects/hollywood-liquors/
cp -r /home/user/jarvis/localboost-ai/docs projects/hollywood-liquors/
cp -r /home/user/jarvis/localboost-ai/agents shared/agents/
cp -r /home/user/jarvis/localboost-ai/prompts shared/prompts/

# Create foundational README files
cat > README.md <<'EOF'
# LocalBoost AI

AI-powered market intelligence, business optimization, and growth tools.

## Projects

- **[Jarvis](./projects/jarvis/)** — Market intelligence dashboard (trading, news, trends)
- **[Hollywood Liquors AI Growth Coach](./projects/hollywood-liquors/)** — Retail optimization platform
- **[WebBull Integration](./projects/webull-integration/)** — Broker API integration
- **[Business Tools](./projects/business-tools/)** — Market research and prospect profiling

## Agent Assignments

See [ORGANIZATION.md](../ORGANIZATION.md) for detailed agent roles.

## Contributing

1. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for setup
2. Follow [branch naming convention](../ORGANIZATION.md#branch-naming-convention)
3. Submit PRs to your project folder; CEO-Agent reviews cross-project changes

## Roadmap

See [shared/docs/Roadmap.md](./shared/docs/Roadmap.md)
EOF

cat > CONTRIBUTING.md <<'EOF'
# Contributing to LocalBoost AI

## Quick Start

1. Clone: `git clone https://github.com/diaznehemiah91-svg/localboost-ai.git`
2. Create branch: `git checkout -b claude/<project>-<agent>-<issue>`
3. Make changes in your project folder
4. Commit with clear messages
5. Push and open PR

## Branch Naming

`claude/<project>-<agent>-<ticket>`

Examples:
- `claude/hollywood-liquors-marketing-new-campaigns`
- `claude/jarvis-research-market-trends`
- `claude/business-tools-sales-demo-updates`

## File Organization

- `projects/<project>/` — Project-specific code
- `shared/` — Reusable agents, prompts, templates
- Agents should work in their own folder to avoid conflicts

## No External Dependencies

All projects target single-file or minimal-dependency deployments:
- Frontend: vanilla JS, inline CSS (no CDN)
- Backend: Python (requirements.txt pinned versions)
- Avoid large frameworks when possible

## Code Review

- CEO-Agent: Reviews cross-project changes
- Project agents: Can merge within their project folder
- All PRs need: clear description, successful tests (if applicable)

## Questions?

Check [ORGANIZATION.md](../ORGANIZATION.md) for agent assignments and decision-making.
EOF

# Add to git
git add .
git commit -m "Initial LocalBoost AI repository structure and documentation"
git push origin main
```

---

### Step 2: Create strategic-research Repository (Isolated)

```bash
# Create repo on GitHub
# https://github.com/new
# - Owner: diaznehemiah91-svg
# - Repository name: strategic-research
# - Description: Strategic Research website (strategicresearch.com, strategicresearch.ai)
# - Public

# Clone locally
git clone https://github.com/diaznehemiah91-svg/strategic-research.git
cd strategic-research

# Set up folders
mkdir -p strategicresearch.{com,ai}/{assets,css,js}
mkdir -p .github/workflows

# Create placeholder website structure (update with real content)
cat > README.md <<'EOF'
# Strategic Research

Public-facing websites and resources.

- [strategicresearch.com](./strategicresearch.com/) — Primary website
- [strategicresearch.ai](./strategicresearch.ai/) — AI-focused version

## Local Development

No build step required. Open `strategicresearch.com/index.html` in browser.

## Deployment

Push to `main` → auto-deploys to GitHub Pages or Vercel (configure in workflows).
EOF

git add .
git commit -m "Initial repository structure"
git push origin main
```

---

### Step 3: Create prompt-library Repository (Optional, Shared)

```bash
# Create repo on GitHub
# https://github.com/new
# - Owner: diaznehemiah91-svg
# - Repository name: prompt-library
# - Description: Reusable, versioned prompt templates for all projects
# - Private or Public (your choice)

# Clone locally
git clone https://github.com/diaznehemiah91-svg/prompt-library.git
cd prompt-library

# Set up folders
mkdir -p {growth-coach,market-research,campaign-generation,trading-analysis}

# Copy prompts from jarvis
cp /home/user/jarvis/localboost-ai/prompts/* growth-coach/

# Create version file
cat > VERSION.md <<'EOF'
# Prompt Library Versioning

## v0.1.0 (Initial Release)
- growth-coach-chat.md (system prompt for AI coach)
- liquor-coach-campaigns.md (campaign generation template)

## Versioning

Follows semantic versioning: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes to prompt structure
- MINOR: New prompts or significant improvements
- PATCH: Bug fixes, minor wording updates

When updating, increment version and add changelog entry.
EOF

git add .
git commit -m "Initial prompt library with growth coach templates"
git push origin main
```

---

### Step 4: Create yerri-lab Repository (Optional, Experimental)

```bash
# Create repo on GitHub
# - Owner: diaznehemiah91-svg
# - Repository name: yerri-lab
# - Description: Experimental projects, MVPs, and R&D

git clone https://github.com/diaznehemiah91-svg/yerri-lab.git
cd yerri-lab

mkdir -p {mvps,prototypes,research}

cat > README.md <<'EOF'
# Yerri Lab

Experimental projects and R&D work.

## Folder Structure

- `mvps/` — Minimum viable products (1-2 week builds)
- `prototypes/` — Concept proofs and explorations
- `research/` — Market research, competitive analysis

## Process

1. Create folder: `mvps/<project-name>/`
2. Add README describing the experiment
3. Build it
4. If successful: migrate to appropriate production repo
5. If unsuccessful: archive and document learnings

## Examples

- `prototypes/webull-options-scanner/` → Could become WebBull feature
- `mvps/market-sentiment-analyzer/` → Could become Jarvis feature
EOF

git add .
git commit -m "Initial experimental lab structure"
git push origin main
```

---

### Step 5: Update jarvis Repo (Archive)

Once migration is complete, update the primary jarvis repo to serve as archive/reference:

```bash
cd /home/user/jarvis

# Create MIGRATION_COMPLETE.md
cat > MIGRATION_COMPLETE.md <<'EOF'
# Repository Migration Complete

This repo has been migided into purpose-built repositories for independent agent work.

## New Repository Locations

- **LocalBoost AI** (primary business): https://github.com/diaznehemiah91-svg/localboost-ai
  - Projects: Jarvis, Hollywood Liquors, WebBull, Business Tools
  
- **Strategic Research** (websites): https://github.com/diaznehemiah91-svg/strategic-research
  - Projects: strategicresearch.com, strategicresearch.ai

- **Prompt Library** (shared): https://github.com/diaznehemiah91-svg/prompt-library
  - Reusable prompt templates

- **Yerri Lab** (experimental): https://github.com/diaznehemiah91-svg/yerri-lab
  - MVPs and prototypes

## What Was Here

This jarvis repo originally contained:
- `engine/` → Now in localboost-ai/projects/jarvis/
- `www/` → Now in localboost-ai/projects/jarvis/
- `localboost-ai/` → Now in localboost-ai (repo root)
- `v4/` → Archived in localboost-ai/projects/jarvis/v4-archive/

## Next Steps

1. Agents should clone their new primary repo
2. Unstar/unfollow this jarvis repo
3. Follow new repos:
   - localboost-ai (everyone)
   - strategic-research (website team)
   - prompt-library (everyone)
   - yerri-lab (R&D team)

## Questions?

See ORGANIZATION.md in new localboost-ai repo for agent assignments.
EOF

# Optional: Remove old project folders after migration confirmed
# git rm -r engine www v4 localboost-ai
# git commit -m "Archive: Projects migrated to dedicated repos"
```

---

## Post-Migration Setup

### For Each New Repo

1. **Create CLAUDE.md** (Claude Code CLI config):
```yaml
# .claude/config.yaml
name: "LocalBoost AI"
description: "AI-powered business tools"

agents:
  - name: "CEO-Agent"
    path: "shared/agents/CEO-Agent.md"
    scope: "strategic"
  - name: "Research-Agent"
    path: "shared/agents/Research-Agent.md"
    scope: "projects/*/docs"
  - name: "Sales-Agent"
    path: "shared/agents/Sales-Agent.md"
    scope: "projects/*/DemoPlaybook.md"
  - name: "Marketing-Agent"
    path: "shared/agents/Marketing-Agent.md"
    scope: "projects/*/campaigns"

skills:
  - path: "shared/docs/DemoPlaybook.md"
  - path: "shared/docs/Roadmap.md"
```

2. **Create GitHub Actions Workflows** (CI/CD):
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd projects/jarvis && python -m pytest tests/ || true
          cd projects/hollywood-liquors && npm test || true
```

3. **Update Pull Request Template**:
```markdown
# .github/pull_request_template.md
## Description
Describe your changes.

## Related Issue
Closes #(issue number)

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
How did you test this?

## Checklist
- [ ] Code follows project style
- [ ] No external dependencies added (unless approved)
- [ ] Documented changes
```

---

## Verification Checklist

After migration:

```bash
# 1. All files migrated
[ ] git log shows clean history
[ ] git ls-tree confirms folder structure

# 2. Each repo has:
[ ] README.md at root
[ ] CONTRIBUTING.md
[ ] CLAUDE.md (or .claude/config.yaml)
[ ] .gitignore

# 3. Agent assignments work:
[ ] CEO-Agent can access shared/docs
[ ] Research-Agent can access projects/*/docs
[ ] Sales-Agent can access projects/*/DemoPlaybook.md
[ ] Marketing-Agent can access projects/*/campaigns

# 4. No large files committed:
[ ] No .psd, .zip, or binaries >5MB
[ ] Git LFS configured if needed

# 5. Branches renamed correctly:
[ ] All branches follow claude/<project>-<agent>-<ticket> pattern
```

---

## Rollback Plan (If Needed)

If migration fails:

```bash
# 1. Check out original jarvis repo
cd /home/user/jarvis
git fetch origin

# 2. Verify nothing was deleted
git log --diff-filter=D --summary | head -20

# 3. If deletion occurred, revert
git revert <commit-hash>

# 4. Push to safe branch
git push origin claude/rollback-<date>
```

---

## Timeline

- **Phase 1** (Day 1): Create all repos, push initial structure
- **Phase 2** (Day 2): Verify all files migrated, test builds
- **Phase 3** (Day 3): Update CLAUDE.md and CI/CD in each repo
- **Phase 4** (Day 4): Agents test working in new repos
- **Phase 5** (Day 5): Archive old jarvis branches, mark complete

**Total**: 5 business days

---

## FAQ

**Q: Do we lose git history?**  
A: No. Use `git subtree split` to preserve commit history per project if needed.

**Q: What about draft PRs in progress?**  
A: Finish or close them before migration. New PRs will be in new repos.

**Q: Can I work on both jarvis and new repos simultaneously?**  
A: No. After migration, jarvis is read-only archive. Work in new repos.

**Q: How do we handle secrets/API keys?**  
A: Never commit them. Use GitHub Secrets and environment variables instead.

---

## Script: Automated Migration (When Ready)

```bash
#!/bin/bash
# migrate-repos.sh - Automates the migration process

PROJECTS=(
  "localboost-ai"
  "strategic-research"
  "prompt-library"
  "yerri-lab"
)

for proj in "${PROJECTS[@]}"; do
  echo "Migrating $proj..."
  git clone https://github.com/diaznehemiah91-svg/$proj.git
  cd $proj
  # ... (run specific migration steps)
  git push origin main
  cd ..
done

echo "✓ Migration complete!"
```

---

**Questions or blockers?** Contact CEO-Agent.
