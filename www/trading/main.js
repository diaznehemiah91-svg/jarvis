/* ── JARVIS Institutional Flow Tracker — Dashboard JS ── */

let allAlerts = [];
let activeTab = 'all';
let sectorMap = {};
let refreshTimer = null;

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadDashboard();
  refreshTimer = setInterval(loadDashboard, 5 * 60 * 1000); // refresh every 5m
});

function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) + ' EST';
  }
  tick();
  setInterval(tick, 1000);
}

// ── Main loader ───────────────────────────────────────────────────────────────

async function loadDashboard() {
  await Promise.all([
    loadSectorMap(),
    loadRegime(),
    loadBriefing(),
    loadRotation(),
    loadDCA(),
  ]);
}

async function triggerRefresh() {
  const btn = document.querySelector('.btn-refresh');
  btn.textContent = '⟳ REFRESHING…';
  btn.disabled = true;
  try {
    await eel.triggerBackgroundRefresh()();
    await new Promise(r => setTimeout(r, 3000)); // let background thread run
    await loadDashboard();
  } finally {
    btn.textContent = '⟳ REFRESH ALL';
    btn.disabled = false;
  }
}

// ── Sector Heatmap ────────────────────────────────────────────────────────────

async function loadSectorMap() {
  const raw = await eel.getSectorMap()();
  sectorMap = JSON.parse(raw);

  const layers = {
    'AI Hardware':    document.getElementById('sectorAI'),
    'Infrastructure': document.getElementById('sectorInfra'),
    'Frontier':       document.getElementById('sectorFrontier'),
  };

  Object.values(layers).forEach(el => el && (el.innerHTML = ''));

  for (const [key, info] of Object.entries(sectorMap)) {
    const container = layers[info.layer];
    if (!container) continue;

    const sentRaw = await eel.getSectorSentiment(key)();
    const sent = JSON.parse(sentRaw);
    const score = sent.combined_score || 0;

    const biasColor = score > 0.1 ? 'var(--green)' : score < -0.1 ? 'var(--red)' : 'var(--orange)';
    const fillPct = Math.round(((score + 1) / 2) * 100);
    const biasLabel = score > 0 ? `+${score.toFixed(3)}` : score.toFixed(3);

    const card = document.createElement('div');
    card.className = 'sector-card';
    card.innerHTML = `
      <div class="sector-card-name">${info.name}</div>
      <div class="sector-card-tickers">${info.tickers.join(' · ')}</div>
      <div class="sector-card-bias" style="color:${biasColor}">${biasLabel} · ${sent.label || ''}</div>
      <div class="bias-bar">
        <div class="bias-fill" style="width:${fillPct}%;background:${biasColor}"></div>
      </div>
    `;
    card.onclick = () => showSectorDetail(key, info);
    container.appendChild(card);
  }
}

async function showSectorDetail(key, info) {
  const snapRaw = await eel.getSectorSnapshot(key)();
  const snap = JSON.parse(snapRaw);
  showRippleModal(
    `${info.name} — Supply Chain`,
    snap.tickers.map(t => `
      <div class="ripple-item">
        <div class="ripple-sector">${t.ticker}</div>
        <div class="ripple-tickers">
          Close: $${(t.close || 0).toFixed(2)} &nbsp;|&nbsp;
          EMA21: $${(t.ema_21 || 0).toFixed(2)} &nbsp;|&nbsp;
          Vol Ratio: ${(t.volume_ratio || 1).toFixed(2)}×
        </div>
        <div class="ripple-rationale">Bias: ${biasLabel(t.bias || 0)}</div>
      </div>
    `).join('')
  );
}

// ── Regime Banner ─────────────────────────────────────────────────────────────

async function loadRegime() {
  const raw = await eel.computeRegime()();
  const r = JSON.parse(raw);

  const banner = document.getElementById('regimeBanner');
  const label  = document.getElementById('regimeLabel');
  const actions = document.getElementById('regimeActions');

  banner.style.background = hexToRgba(r.regime_color, 0.08);
  banner.style.borderBottomColor = r.regime_color;

  label.textContent = r.regime_label;
  label.style.color = r.regime_color;

  document.getElementById('pillTech').textContent =
    `TECH BIAS: ${(r.components.tech_bias > 0 ? '+' : '')}${r.components.tech_bias.toFixed(3)}`;
  document.getElementById('pillNews').textContent =
    `NEWS SENT: ${(r.components.news_sentiment > 0 ? '+' : '')}${r.components.news_sentiment.toFixed(3)}`;
  document.getElementById('pillReddit').textContent =
    `REDDIT MOM: ${(r.components.reddit_momentum > 0 ? '+' : '')}${r.components.reddit_momentum.toFixed(3)}`;
  document.getElementById('pillVIX').textContent =
    `VIX: ${r.vix_level.toFixed(1)}`;

  actions.innerHTML = r.actions.map((a, i) =>
    `<span style="color:${r.regime_color}">▸</span> ${a}${i < r.actions.length - 1 ? '<br>' : ''}`
  ).join('');
}

// ── Alert Feed ────────────────────────────────────────────────────────────────

async function loadBriefing() {
  const raw = await eel.getFullBriefing()();
  const briefing = JSON.parse(raw);
  allAlerts = briefing.alerts || [];

  // Load sentiment sidebar from alerts data
  loadSentimentSidebar(allAlerts);
  renderAlerts();
}

function renderAlerts() {
  const feed = document.getElementById('alertFeed');
  let filtered = allAlerts;

  if (activeTab !== 'all') {
    filtered = allAlerts.filter(a => {
      if (activeTab === 'whale_block')    return a.type === 'WHALE_BLOCK';
      if (activeTab === 'options_sweep') return a.type === 'OPTIONS_SWEEP';
      if (activeTab === 'SENTIMENT_SPIKE') return a.type === 'SENTIMENT_SPIKE';
      return true;
    });
  }

  if (filtered.length === 0) {
    feed.innerHTML = '<div class="empty">No alerts in this category.</div>';
    return;
  }

  feed.innerHTML = filtered.map(a => {
    const timeStr = a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '';
    const dirClass = a.data?.direction === 'bearish' ? 'bearish' : 'bullish';

    return `
      <div class="alert-card ${a.priority}" onclick="handleAlertClick(${JSON.stringify(a).replace(/"/g, '&quot;')})">
        <div class="alert-priority">[${a.priority}] ${a.type}</div>
        <div class="alert-title ${a.type === 'WHALE_BLOCK' || a.type === 'OPTIONS_SWEEP' ? dirClass : ''}">
          ${a.title}
        </div>
        <div class="alert-body">${a.body}</div>
        <div class="alert-time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

function switchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts();
}

async function handleAlertClick(alert) {
  if (alert.type === 'WHALE_BLOCK' && alert.data?.ticker) {
    const raw = await eel.getFlowRipple(alert.data.ticker)();
    const ripple = JSON.parse(raw);
    showRippleModal(
      `${alert.data.ticker} — Supply Chain Ripple`,
      ripple.ripple_effects.map(r => `
        <div class="ripple-item">
          <div class="ripple-sector">${r.sector_name}</div>
          <div class="ripple-tickers">${r.tickers.join(' · ')}</div>
          <div class="ripple-rationale">${r.rationale}</div>
        </div>
      `).join('') || '<div class="empty">No downstream sectors mapped.</div>'
    );
  }
}

// ── Sentiment Sidebar ─────────────────────────────────────────────────────────

function loadSentimentSidebar(alerts) {
  const grid = document.getElementById('sentimentGrid');
  const sentAlerts = alerts.filter(a => a.type === 'SENTIMENT_SPIKE');

  if (sentAlerts.length === 0) {
    // Load top sector sentiments instead
    loadTopSectorSentiment();
    return;
  }

  grid.innerHTML = sentAlerts.slice(0, 8).map(a => {
    const ticker = a.data?.ticker || '';
    const pct = a.data?.pct_change || 0;
    const color = pct > 0 ? 'var(--green)' : 'var(--red)';
    return `
      <div class="sent-row">
        <span class="sent-ticker">${ticker}</span>
        <span class="sent-label">${a.data?.source || ''} spike</span>
        <span class="sent-score" style="color:${color}">${pct > 0 ? '+' : ''}${pct.toFixed(0)}%</span>
      </div>
    `;
  }).join('');
}

async function loadTopSectorSentiment() {
  const grid = document.getElementById('sentimentGrid');
  const keys = Object.keys(sectorMap).slice(0, 8);
  const rows = [];
  for (const key of keys) {
    const raw = await eel.getSectorSentiment(key)();
    const s = JSON.parse(raw);
    const score = s.combined_score || 0;
    const color = score > 0.05 ? 'var(--green)' : score < -0.05 ? 'var(--red)' : 'var(--orange)';
    rows.push(`
      <div class="sent-row">
        <span class="sent-ticker" style="font-size:9px;min-width:70px">${s.sector_name?.split('&')[0]?.trim() || key}</span>
        <span class="sent-label">${s.label || ''}</span>
        <span class="sent-score" style="color:${color}">${score > 0 ? '+' : ''}${score.toFixed(3)}</span>
      </div>
    `);
  }
  grid.innerHTML = rows.join('');
}

// ── DCA Watchlist ─────────────────────────────────────────────────────────────

async function loadDCA() {
  const raw = await eel.getDcaCandidates()();
  const candidates = JSON.parse(raw);
  const list = document.getElementById('dcaList');

  if (!candidates || candidates.length === 0) {
    list.innerHTML = '<div class="empty">DCA mode inactive (not in risk-off regime)</div>';
    return;
  }

  list.innerHTML = candidates.map(c => `
    <div class="dca-card">
      <div class="dca-ticker">${c.ticker} <span style="color:var(--text-dim);font-size:10px">DCA TARGET</span></div>
      <div class="dca-name">${c.name}</div>
      <div class="dca-reason">${c.rationale}</div>
    </div>
  `).join('');
}

// ── Rotation ──────────────────────────────────────────────────────────────────

async function loadRotation() {
  const raw = await eel.detectRotation()();
  const rot = JSON.parse(raw);
  const card = document.getElementById('rotationCard');

  const color = rot.rotation_signal ? 'var(--orange)' : 'var(--green)';
  card.style.borderColor = color;
  card.innerHTML = `
    <div style="color:${color};margin-bottom:6px;font-size:12px">
      ${rot.rotation_signal ? '⚠ ROTATION ACTIVE' : '✓ NO ROTATION'}
    </div>
    <div>AI Hardware Bias: <strong style="color:${rot.ai_hardware_bias > 0 ? 'var(--green)' : 'var(--red)'}">${(rot.ai_hardware_bias > 0 ? '+' : '')}${rot.ai_hardware_bias.toFixed(3)}</strong></div>
    <div>Infrastructure Bias: <strong style="color:${rot.infrastructure_bias > 0 ? 'var(--green)' : 'var(--red)'}">${(rot.infrastructure_bias > 0 ? '+' : '')}${rot.infrastructure_bias.toFixed(3)}</strong></div>
    <div style="margin-top:6px;color:var(--text-dim)">${rot.narrative}</div>
  `;
}

// ── Ripple Modal ──────────────────────────────────────────────────────────────

function showRippleModal(title, bodyHtml) {
  document.getElementById('rippleTitle').textContent = title;
  document.getElementById('rippleBody').innerHTML = bodyHtml;
  document.getElementById('rippleModal').classList.add('open');
}

function closeRipple() {
  document.getElementById('rippleModal').classList.remove('open');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function biasLabel(score) {
  if (score > 0.3) return '↑ Strong Uptrend';
  if (score > 0.05) return '↑ Above EMA';
  if (score < -0.3) return '↓ Strong Downtrend';
  if (score < -0.05) return '↓ Below EMA';
  return '→ At EMA';
}
