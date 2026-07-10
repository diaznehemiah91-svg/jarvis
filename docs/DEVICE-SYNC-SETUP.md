# Multi-Device Claude Sync Setup

**Goal**: Keep the same Claude instance, projects, and information synced across ALL your devices

---

## 🌐 3 Ways to Sync Claude Across Devices

### Option 1: Cloud Sync via GitHub ✅ RECOMMENDED
**Best for**: Laptop + Desktop + Mobile + Remote

```bash
# All your devices pull from the same GitHub repo
git clone https://github.com/diaznehemiah91-svg/jarvis.git
cd jarvis
git pull origin main
```

**Advantages**:
- All changes sync instantly
- Full version control
- Access from anywhere
- No data loss

**Setup**:
1. Make sure all changes are pushed to GitHub
2. On each device: `git clone` the repo
3. To sync: `git pull origin main`
4. Changes made on any device: `git push origin main`

---

### Option 2: Claude Code Web Access
**Best for**: Quick access without setup

1. Go to **claude.ai/code**
2. Log in with your account (diaznehemiah91@gmail.com)
3. Select repository: `diaznehemiah91-svg/jarvis`
4. All your work is there - synced automatically

**Advantages**:
- Zero setup
- Browser-based
- Mobile friendly
- Instant sync

---

### Option 3: Cloud Backup + Local Sync
**Best for**: Extra safety + complete backup

```bash
# Backup to cloud (Google Drive, OneDrive, Dropbox)
# Then pull on each device
rclone copy jarvis/ drive:jarvis-backup
```

---

## 📱 Device Setup Instructions

### Laptop (Primary)
```bash
cd ~/projects
git clone https://github.com/diaznehemiah91-svg/jarvis.git
cd jarvis
git config user.email "diaznehemiah91@gmail.com"
git config user.name "Yerri"
# Now all changes auto-sync to GitHub
```

### Desktop
```bash
# Same as laptop
git clone https://github.com/diaznehemiah91-svg/jarvis.git
cd jarvis
git pull origin main  # Get latest
```

### Mobile (Remote Session)
```
1. Use claudecode.com web interface
2. Sign in with your Google account
3. Select jarvis repository
4. Access all your code
```

### Remote Server
```bash
ssh your-remote-server
cd /home/user/jarvis
git fetch origin
git pull origin main
# You're up to date!
```

---

## 🔄 Sync Workflow

### When Working on Laptop
```bash
cd ~/jarvis
git add .
git commit -m "Work from laptop"
git push origin main
```

### Then on Desktop (5 seconds to sync)
```bash
cd ~/jarvis
git pull origin main
# Everything from laptop is now here
```

### From Mobile (Web)
- Go to claude.ai/code
- Changes appear automatically
- No commands needed

---

## 🧠 Claude Memory Sync

### Claude Code Settings
All your Claude Code settings sync automatically:
- Model preferences
- Keybindings
- Project settings
- Permission settings
- Hook configurations

**Location**: `~/.claude/settings.json` (automatically synced)

### Project-Specific Config
Your Jarvis project settings:
- `engine/config.py` - API keys and settings
- `.claude/settings.json` - Project-specific hooks
- `requirements.txt` - Dependencies

**These stay in git** and sync across devices

---

## 🔐 What Gets Synced

✅ **Automatically Synced**:
- All source code files
- Configuration files (engine/config.py)
- Documentation
- Git history
- Project structure

✅ **Semi-Auto (Requires Manual Push)**:
- New files you create
- Modified files
- Changes to existing code

⚠️ **NOT Synced** (Keep Locally):
- `.env` files with secrets
- `*.pyc` compiled files
- `node_modules/`
- Virtual environments
- Personal notes in /tmp/

---

## 📋 Multi-Device Checklist

- [ ] GitHub repo pushed (claude/webull-positions-check-25xes3)
- [ ] All changes committed locally
- [ ] All branches up to date
- [ ] Each device has git configured:
  ```bash
  git config user.email "diaznehemiah91@gmail.com"
  git config user.name "Yerri"
  ```
- [ ] Test sync: Edit file on Device A, pull on Device B
- [ ] Set up auto-pull on startup (optional - see below)

---

## ⚡ Optional: Auto-Sync on Startup

### Linux/Mac (Add to ~/.bashrc)
```bash
function sync_jarvis() {
  cd ~/projects/jarvis
  git pull origin main
  echo "✓ Jarvis synced"
}

# Run on every terminal startup
sync_jarvis
```

### Windows (Create sync.bat)
```batch
@echo off
cd C:\Users\Yerri\projects\jarvis
git pull origin main
echo ✓ Jarvis synced
pause
```

### Automatic Background Sync (Every 5 minutes)
```bash
# Install git-sync
brew install git-sync  # or apt-get, or from source

# Start background sync
git-sync --repo /Users/Yerri/projects/jarvis \
         --branch main \
         --interval 300
```

---

## 🚀 Test Your Multi-Device Setup

1. **On Device A (Laptop)**:
   ```bash
   echo "Test from Device A" > test.txt
   git add test.txt
   git commit -m "Test sync from laptop"
   git push origin main
   ```

2. **On Device B (Desktop)**:
   ```bash
   git pull origin main
   cat test.txt
   # Output: "Test from Device A" ✓
   ```

3. **On Mobile (Web)**:
   - Go to claude.ai/code
   - Open jarvis repo
   - You see test.txt there too ✓

---

## 📱 Current Device Status

**Laptop**: ✅ Primary dev environment (claude/webull-positions-check-25xes3)
**Desktop**: ⏳ Needs sync setup
**Mobile**: ⏳ Use web interface
**Remote**: ⏳ Needs git pull setup

---

## 🔗 Quick Reference

| Device | How to Access | Sync Method |
|--------|--------------|------------|
| Laptop | `git pull origin main` | Auto-commit |
| Desktop | `git clone` + `git pull` | Manual pull |
| Mobile | claude.ai/code | Automatic |
| Remote | SSH + git pull | Manual pull |

---

## 🆘 Troubleshooting Sync

**Problem**: Changes on Device A don't appear on Device B
```bash
# Solution: Device B needs to pull
cd jarvis && git pull origin main
```

**Problem**: Merge conflicts
```bash
# Resolve on primary device
git status
git merge --abort  # or fix conflicts
git pull origin main
# Re-test on other devices
```

**Problem**: Password prompt on every pull
```bash
# Set up SSH keys for passwordless sync
ssh-keygen -t ed25519
# Add public key to GitHub Settings
# Then use SSH URLs: git@github.com:diaznehemiah91-svg/jarvis.git
```

---

## ✅ When Complete

You'll have:
- ✅ Same Claude instance accessible from all devices
- ✅ All work synced in real-time
- ✅ Full version control of changes
- ✅ Easy rollback if needed
- ✅ Access from anywhere (web, desktop, mobile)
- ✅ Automatic backup to GitHub

---

**Status**: Ready to deploy across devices  
**Next**: Choose your setup method above and configure each device

