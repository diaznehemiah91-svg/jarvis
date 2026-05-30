/* ════════════════════════════════════════════════════════════════════
   JARVIS Command Center — Application Core
   ════════════════════════════════════════════════════════════════════ */

const State = {
  sectorMap: {},
  regime: null,
  opportunities: null,
  options: null,
  heatmap: null,
  briefing: null,
  news: null,
  dca: null,
  rotation: null,
  view: 'overview',
  oppTab: 'buys',
  flowFilter: 'all',
  layerFilter: 'all',
  newsTab: 'power',
  nrTab: 'power',
  optDir: 'all',
};

let globeInitialized = false;   // heatmap-view globe
let ovGlobe = null;             // overview hero globe instance
let hmGlobe = null;             // heatmap-view globe instance

// ── eel call helper (works with real eel and the demo shim) ──────────────────
function call(fn, ...args) {
  return new Promise((resolve) => {
    try {
      const r = window.eel[fn](...args);
      const p = r(/* callback */(res) => resolve(parse(res)));
      if (p && typeof p.then === 'function') p.then((res) => resolve(parse(res)));
    } catch (e) { console.error('call', fn, e); resolve(null); }
  });
}
function parse(v) { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } }

// ════ BOOT ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  startClock();
  initParticles();
  initNav();
  initPalette();
  initKeyboard();
  initVoice();
  initButtons();
  initGlobeHero();
  initNewsRail();
  updateMarketStatus();
  setInterval(updateMarketStatus, 30000);

  await loadAll();
  loadNews();                              // populate the overview Breaking-News rail
  setInterval(loadNews, 4 * 60 * 1000);    // refresh headlines every 4 min
  setInterval(loadAll, 5 * 60 * 1000); // auto-refresh every 5 min

  // Greet once data is ready
  setTimeout(() => {
    if (State.regime) {
      const name = State.regime.regime_label.split('/')[0].trim();
      Voice.speak(`Good day. JARVIS online. Market regime is ${name}. ${State.opportunities?.buys?.length || 0} long opportunities flagged.`);
    }
  }, 1200);
});

async function loadAll() {
  const [sm, regime, opps, opts, heat, brief, status, dca, rotation] = await Promise.all([
    call('getSectorMap'),
    call('computeRegime'),
    call('getOpportunities', 16),
    call('getOptionsIdeas', 24),
    call('getSectorHeatmap'),
    call('getFullBriefing'),
    call('getDataStatus'),
    call('getDcaCandidates'),
    call('detectRotation'),
  ]);
  State.sectorMap = sm || {};
  State.regime = regime;
  State.opportunities = opps;
  State.options = opts;
  State.heatmap = heat;
  State.briefing = brief;
  State.dataStatus = status;
  State.dca = Array.isArray(dca) ? dca : [];
  State.rotation = rotation;

  renderDataBadge();
  renderTicker();
  renderRegime();
  renderStats();
  renderOverviewOpps();
  renderOverviewOpts();
  renderDcaPanel();
  renderRotationBanner();
  renderFeed();
  renderMiniHeat();
  renderOverviewGlobe();
  if (globeInitialized) renderGlobe(State.layerFilter);
  renderOpportunities();
  renderOptions();
  renderFlow();
  renderFlowStats();
}

// ════ CLOCK & MARKET STATUS ═════════════════════════════════════════════════
function startClock() {
  const el = document.getElementById('clock');
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  };
  tick(); setInterval(tick, 1000);
}

function updateMarketStatus() {
  // US market hours 9:30–16:00 ET (approx via UTC-4/5; use local heuristic)
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  const open = day >= 1 && day <= 5 && mins >= 570 && mins < 960;
  const el = document.getElementById('marketStatus');
  const txt = document.getElementById('marketStatusText');
  el.classList.toggle('closed', !open);
  txt.textContent = open ? 'MARKET OPEN' : 'MARKET CLOSED';
}

// ════ COLOR SCALE ═══════════════════════════════════════════════════════════
function scoreColor(v) {
  // v in [-1, 1] → red → amber → green
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) {
    const g = [31, 224, 160], a = [255, 200, 87];
    return mix(a, g, t);
  } else {
    const r = [255, 84, 112], a = [255, 200, 87];
    return mix(a, r, -t);
  }
}
function mix(c1, c2, t) {
  const c = c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function tileBg(v) {
  const t = Math.max(-1, Math.min(1, v));
  const col = scoreColor(v);
  const alpha = 0.10 + Math.abs(t) * 0.30;
  return col.replace('rgb', 'rgba').replace(')', `,${alpha.toFixed(2)})`);
}
const fmt = (v, d = 2) => (v == null ? '—' : (v > 0 && d > 0 ? '+' : '') + Number(v).toFixed(d));
const usd = (v) => v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

// ════ REGIME ════════════════════════════════════════════════════════════════
function renderRegime() {
  const r = State.regime;
  if (!r) return;
  document.getElementById('regimeName').textContent = r.regime_label.split('/')[0].trim();
  document.getElementById('regimeName').style.color = r.regime_color;
  document.getElementById('regimeScore').textContent = `Composite ${fmt(r.regime_score, 3)}`;
  document.getElementById('regimeVix').textContent = `VIX ${r.vix_level.toFixed(1)}`;

  drawGauge(r.regime_score, r.regime_color);

  const comps = [
    ['TECHNICAL BIAS', r.components.tech_bias, 0.4],
    ['NEWS SENTIMENT', r.components.news_sentiment, 0.4],
    ['REDDIT MOMENTUM', r.components.reddit_momentum, 0.2],
  ];
  document.getElementById('regimeComponents').innerHTML = comps.map(([lbl, v]) => {
    const col = scoreColor(v);
    const w = Math.abs(v) * 50;
    const left = v >= 0 ? 50 : 50 - w;
    return `<div class="comp-pill">
      <div class="comp-label">${lbl}</div>
      <div class="comp-val" style="color:${col}">${fmt(v, 3)}</div>
      <div class="comp-bar"><i style="left:${left}%;width:${w}%;background:${col}"></i></div>
    </div>`;
  }).join('');

  document.getElementById('regimeActionList').innerHTML =
    (r.actions || []).slice(0, 4).map(a => `<div class="regime-action"><b>▸</b> ${a}</div>`).join('');
}

function drawGauge(score, color) {
  // score in [-1,1] → arc from -90° to +90°
  const pct = (score + 1) / 2; // 0..1
  const R = 54, C = Math.PI * R; // semicircle length
  const dash = C * pct;
  document.getElementById('regimeGauge').innerHTML = `
    <svg viewBox="0 0 130 130" width="130" height="130">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff5470"/>
          <stop offset="50%" stop-color="#ffc857"/>
          <stop offset="100%" stop-color="#1fe0a0"/>
        </linearGradient>
      </defs>
      <path d="M 11 100 A 54 54 0 0 1 119 100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" stroke-linecap="round"/>
      <path d="M 11 100 A 54 54 0 0 1 119 100" fill="none" stroke="url(#gg)" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${dash} ${C}" style="transition:stroke-dasharray 0.8s cubic-bezier(0.2,0.8,0.2,1)"/>
      <circle cx="${65 + 54 * Math.cos(Math.PI - pct * Math.PI)}" cy="${100 - 54 * Math.sin(Math.PI - pct * Math.PI)}"
              r="7" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="65" y="86" text-anchor="middle" fill="${color}" font-family="Orbitron" font-size="22" font-weight="700">${Math.round(pct * 100)}</text>
      <text x="65" y="104" text-anchor="middle" fill="#6b87a8" font-family="Rajdhani" font-size="10" letter-spacing="2">INDEX</text>
    </svg>`;
}

// ════ STATS ═════════════════════════════════════════════════════════════════
function renderStats() {
  document.getElementById('statBuysNum').textContent = State.opportunities?.buys?.length ?? '—';
  document.getElementById('statSellsNum').textContent = State.opportunities?.sells?.length ?? '—';
  const flowCount = (State.briefing?.alerts || []).filter(a => a.type === 'WHALE_BLOCK' || a.type === 'OPTIONS_SWEEP').length;
  document.getElementById('statFlowNum').textContent = flowCount;
}

// ════ OVERVIEW OPPORTUNITY STRIP ════════════════════════════════════════════
function actionColor(action) {
  if (/STRONG BUY|BUY|ACCUMULATE|DCA/.test(action)) return 'var(--green)';
  if (/SELL|TRIM|AVOID/.test(action)) return 'var(--red)';
  return 'var(--gold)';
}
function actionBg(action) {
  const c = actionColor(action);
  return c.replace('var(--green)', 'rgba(31,224,160,0.16)')
          .replace('var(--red)', 'rgba(255,84,112,0.16)')
          .replace('var(--gold)', 'rgba(255,200,87,0.16)');
}

function renderOverviewOpps() {
  const buys = State.opportunities?.buys || [];
  document.getElementById('ovOppStrip').innerHTML = buys.slice(0, 8).map(o => `
    <div class="opp-mini" onclick="openDrawer('${o.ticker}')">
      <div class="opp-mini-top">
        <span class="opp-sym">${o.ticker}</span>
        <span class="opp-action" style="color:${actionColor(o.action)};background:${actionBg(o.action)}">${o.action}</span>
      </div>
      <div class="opp-mini-px">${usd(o.price)}</div>
      <div class="conv-bar"><i style="width:${o.conviction}%;background:${actionColor(o.action)}"></i></div>
      <div class="opp-conv-lbl">${o.conviction}% conviction</div>
    </div>`).join('') || '<div style="color:var(--text-faint)">No signals.</div>';
}

// ════ OVERVIEW OPTIONS STRIP (balanced bull + bear) ═════════════════════════
function renderOverviewOpts() {
  const el = document.getElementById('ovOptStrip');
  if (!el) return;
  const all = State.options?.ideas || [];
  // Show a balanced mix: top 4 bullish + top 4 bearish.
  const bull = all.filter(i => i.direction === 'bullish').slice(0, 4);
  const bear = all.filter(i => i.direction === 'bearish').slice(0, 4);
  const mix = [];
  for (let k = 0; k < 4; k++) { if (bull[k]) mix.push(bull[k]); if (bear[k]) mix.push(bear[k]); }
  el.innerHTML = mix.map(i => {
    const isBull = i.direction === 'bullish';
    const col = isBull ? 'var(--green)' : 'var(--red)';
    return `<div class="opt-mini" onclick="openDrawer('${i.ticker}')">
      <div class="opt-mini-top">
        <span class="opp-sym">${i.ticker}</span>
        <span class="opt-mini-dir" style="color:${col}">${isBull ? '▲' : '▼'}</span>
      </div>
      <div class="opt-mini-strat" style="color:${col}">${i.strategy}</div>
      <div class="opt-mini-contract">${i.contract}</div>
      <div class="opt-mini-be">BE $${i.breakeven != null ? i.breakeven : '—'} · ${i.conviction}%</div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint)">No options ideas yet.</div>';
}

// ════ DCA WATCHLIST PANEL ════════════════════════════════════════════════════
function renderDcaPanel() {
  const el = document.getElementById('dcaStrip');
  const tag = document.getElementById('dcaRegimeTag');
  if (!el) return;
  const list = State.dca || [];
  const mode = list[0]?.regime_mode || (State.regime?.regime || 'risk_on');
  const modeColor = mode === 'risk_on' ? 'var(--green)' : mode === 'risk_off' ? 'var(--red)' : 'var(--gold)';
  const modeLabel = mode === 'risk_on' ? 'RISK-ON' : mode === 'risk_off' ? 'RISK-OFF · DCA MODE' : 'DEFENSIVE';
  if (tag) { tag.textContent = modeLabel; tag.style.color = modeColor; tag.style.borderColor = modeColor + '44'; }
  if (!list.length) {
    el.innerHTML = '<div style="color:var(--text-faint);padding:12px 0">No watchlist data — sync first.</div>';
    return;
  }
  el.innerHTML = list.slice(0, 7).map(d => {
    const col = d.sentiment >= 0.08 ? 'var(--green)' : d.sentiment <= -0.08 ? 'var(--red)' : 'var(--gold)';
    const bar = Math.min(100, Math.abs(d.sentiment) * 200);
    return `<div class="dca-card" onclick="openDrawer('${d.ticker}')">
      <div class="dca-top">
        <span class="dca-sym" style="color:${col}">${d.ticker}</span>
        <span class="dca-sent" style="color:${col}">${d.sentiment_label}</span>
      </div>
      <div class="dca-name">${d.name}</div>
      <div class="dca-rationale">${d.rationale}</div>
      <div class="dca-bar"><i style="width:${bar}%;background:${col}"></i></div>
    </div>`;
  }).join('');
}

// ════ ROTATION BANNER ════════════════════════════════════════════════════════
function renderRotationBanner() {
  const r = State.rotation;
  const el = document.getElementById('rotationBanner');
  if (!el) return;
  if (!r?.rotation_signal) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.querySelector('.rot-text').textContent =
    `${r.narrative}  ·  AI HW ${fmt(r.ai_hardware_bias, 2)}  ▸  INFRA ${fmt(r.infrastructure_bias, 2)}  [Δ ${fmt(r.divergence, 3)}]`;
}

// ════ FEED ══════════════════════════════════════════════════════════════════
function renderFeed() {
  const alerts = State.briefing?.alerts || [];
  document.getElementById('ovFeed').innerHTML = alerts.map(a => {
    const t = a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '';
    const ticker = a.data?.ticker;
    return `<div class="feed-item ${a.priority}" ${ticker ? `onclick="openDrawer('${ticker}')"` : ''}>
      <div class="feed-tag">[${a.priority}] ${a.type.replace(/_/g, ' ')}</div>
      <div class="feed-title">${a.title}</div>
      <div class="feed-body">${a.body}</div>
      <div class="feed-time">${t}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);padding:10px">Feed quiet. Run a sync.</div>';
}

// ════ MINI HEATMAP ══════════════════════════════════════════════════════════
function renderMiniHeat() {
  const sectors = State.heatmap?.sectors || [];
  const tiles = [];
  sectors.forEach(s => s.tiles.forEach(t => tiles.push(t)));
  tiles.sort((a, b) => b.net_score - a.net_score);
  document.getElementById('ovMiniHeat').innerHTML = tiles.slice(0, 24).map(t => `
    <div class="mini-tile" style="background:${tileBg(t.net_score)};border-color:${scoreColor(t.net_score)}33"
         onclick="openDrawer('${t.ticker}')" title="${t.ticker} ${fmt(t.net_score,3)}">
      <span class="mt-sym" style="color:${scoreColor(t.net_score)}">${t.ticker}</span>
      <span class="mt-val">${fmt(t.net_score, 2)}</span>
    </div>`).join('');
}

// ════ OVERVIEW PREMIUM GLOBE HERO ═════════════════════════════════════════════
function allHeatmapTiles() {
  const tiles = [];
  (State.heatmap?.sectors || []).forEach(s => {
    s.tiles.forEach(t => tiles.push({ ...t, layer: s.layer, sector: s.name }));
  });
  return tiles;
}

function initGlobeHero() {
  // Date stamp
  const d = document.getElementById('ghDate');
  if (d) d.textContent = new Date().toLocaleDateString('en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Build the WebGL globe instance (renders the Earth immediately)
  if (typeof Globe !== 'undefined' && Globe.create && !ovGlobe) {
    ovGlobe = Globe.create('globeHeroStage', { onClick: openDrawer });
  }

  // Controls
  const rot = document.getElementById('ghRotate');
  const rst = document.getElementById('ghReset');
  if (rot) {
    rot.classList.add('active');
    rot.addEventListener('click', () => {
      if (!ovGlobe) return;
      const on = !ovGlobe.isRotating();
      ovGlobe.setRotate(on);
      rot.classList.toggle('active', on);
    });
  }
  if (rst) rst.addEventListener('click', () => ovGlobe && ovGlobe.reset());
}

function renderOverviewGlobe() {
  const tiles = allHeatmapTiles();
  if (ovGlobe) ovGlobe.setData(tiles, 'all');
  renderGlobeWatchlist(tiles);
  renderGlobeStats(tiles);
}

function renderGlobeWatchlist(tiles) {
  const el = document.getElementById('ghWatch');
  if (!el) return;
  const sorted = [...tiles].sort((a, b) => Math.abs(b.net_score) - Math.abs(a.net_score)).slice(0, 12);
  el.innerHTML = sorted.map(t => {
    const bull = t.net_score >= 0;
    const col = scoreColor(t.net_score);
    const w = Math.min(100, Math.abs(t.net_score) * 100);
    const label = t.action || (bull ? 'BULLISH' : 'BEARISH');
    return `<div class="gh-watch-row" onclick="openDrawer('${t.ticker}')" title="${t.sector || ''}">
      <span class="gh-watch-sym">${t.ticker}</span>
      <span class="gh-watch-spark"><i style="width:${w}%;background:${col}"></i></span>
      <span class="gh-watch-badge" style="color:${col};background:${col}1f">${label}</span>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);font-size:11px;padding:6px">Sync to load.</div>';
}

function renderGlobeStats(tiles) {
  const el = document.getElementById('ghStats');
  if (!el) return;
  let bull = 0, bear = 0, neutral = 0;
  tiles.forEach(t => {
    if (t.net_score > 0.05) bull++;
    else if (t.net_score < -0.05) bear++;
    else neutral++;
  });
  const total = tiles.length;
  const cells = [
    ['#1fe0a0', bull, 'BULLISH'],
    ['#ff5470', bear, 'BEARISH'],
    ['#ffc857', neutral, 'NEUTRAL'],
    ['#00d4ff', total, 'TOTAL'],
  ];
  el.innerHTML = cells.map(([c, n, l]) =>
    `<div class="gh-stat"><div class="gh-stat-num" style="color:${c}">${n}</div><div class="gh-stat-lbl">${l}</div></div>`
  ).join('');
}

// ════ 3D GLOBE VIEW (Heat Maps tab) ═══════════════════════════════════════════
function renderGlobe(layerFilter) {
  const allTiles = [];
  (State.heatmap?.sectors || []).forEach(s => {
    s.tiles.forEach(t => allTiles.push({ ...t, layer: s.layer, sector: s.name }));
  });
  if (hmGlobe) hmGlobe.setData(allTiles, layerFilter || State.layerFilter || 'all');
  renderGlobeMovers(allTiles, layerFilter || State.layerFilter || 'all');
}

function renderGlobeMovers(tiles, layerFilter) {
  const filtered = (layerFilter && layerFilter !== 'all')
    ? tiles.filter(t => t.layer === layerFilter)
    : tiles;
  const sorted = [...filtered].sort((a, b) => Math.abs(b.net_score) - Math.abs(a.net_score));
  const el = document.getElementById('globeMovers');
  if (!el) return;
  el.innerHTML = sorted.map(t => {
    const col  = t.net_score >= 0 ? 'var(--green)' : 'var(--red)';
    const sign = t.net_score >= 0 ? '+' : '';
    const w    = Math.min(100, Math.abs(t.net_score) * 100);
    return `<div class="globe-mover-row" onclick="openDrawer('${t.ticker}')">
      <span class="globe-mover-sym" style="color:${col}">${t.ticker}</span>
      <div class="globe-mover-bar"><i style="width:${w}%;background:${col}"></i></div>
      <span class="globe-mover-score" style="color:${col}">${sign}${Number(t.net_score).toFixed(2)}</span>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);padding:8px 4px;font-size:12px">No data — sync first.</div>';
}

// ════ NEWS VIEW ═══════════════════════════════════════════════════════════════
async function loadNews() {
  const [power, market] = await Promise.all([
    call('getPowerNews', 18),
    call('getMarketNews', 20),
  ]);
  State.news = { power, market };
  renderNews();
  renderNewsRail();
}

// ════ OVERVIEW BREAKING-NEWS RAIL ═════════════════════════════════════════════
function initNewsRail() {
  document.querySelectorAll('[data-nrtab]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-nrtab]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    State.nrTab = b.dataset.nrtab;
    renderNewsRail();
  }));
  const r = document.getElementById('nrRefresh');
  if (r) r.addEventListener('click', () => {
    document.getElementById('newsRailBody').innerHTML = '<div class="nr-loading">Refreshing headlines…</div>';
    loadNews();
  });
}

function newsArticles(tab) {
  const data = State.news?.[tab];
  if (Array.isArray(data)) return data;
  return data?.items || data?.articles || [];
}
// Normalize a news item across backend/legacy field names.
function newsField(a) {
  return {
    title: a.headline || a.title || '—',
    source: a.source || 'News',
    sentiment: a.sentiment || 0,
    power: a.power != null ? a.power : a.power_score,
    ts: a.ts || (a.timestamp ? a.timestamp / 1000 : null),
    url: a.url || '',
    ticker: a.ticker || '',
    summary: a.summary || '',
  };
}

function newsCat(sent) {
  if (sent > 0.08) return ['bull', 'BULLISH'];
  if (sent < -0.08) return ['bear', 'BEARISH'];
  return ['neut', 'NEUTRAL'];
}

function renderNewsRail() {
  const el = document.getElementById('newsRailBody');
  if (!el) return;
  const articles = newsArticles(State.nrTab || 'power');
  if (!articles.length) {
    el.innerHTML = '<div class="nr-loading">No headlines yet — click ⟳ to fetch.</div>';
    return;
  }
  const [feat, ...rest] = articles;
  const card = (raw, featured) => {
    const a = newsField(raw);
    const [cls, label] = newsCat(a.sentiment);
    const ts = a.ts ? _timeAgo(new Date(a.ts * 1000)) : '';
    const pw = a.power != null ? `<span class="nr-power">⚡ ${(a.power * 100).toFixed(0)}</span>` : '';
    const url = a.url ? a.url.replace(/'/g, "\\'") : '';
    const click = url ? `onclick="window.open('${url}','_blank')"` : (a.ticker ? `onclick="openDrawer('${a.ticker}')"` : '');
    return `<div class="${featured ? 'nr-feature' : 'nr-item'}" ${click}>
      <div class="nr-tags">
        <span class="nr-cat ${cls}">${label}</span>
        <span class="nr-src">${a.source}</span>
        ${pw}
      </div>
      <div class="nr-title">${a.title}</div>
      <div class="nr-meta">
        ${a.ticker ? `<span class="nr-ticker">${a.ticker}</span>` : ''}
        <span>${ts}</span>
      </div>
    </div>`;
  };

  let html = '';
  if (feat) {
    html += `<div class="nr-section">⦿ Breaking</div>`;
    html += card(feat, true);
  }
  if (rest.length) {
    html += `<div class="nr-section top">Top Stories</div>`;
    html += rest.slice(0, 14).map(a => card(a, false)).join('');
  }
  el.innerHTML = html;
}

function renderNews() {
  const articles = newsArticles(State.newsTab || 'power');
  const el = document.getElementById('newsGrid');
  if (!el) return;
  if (!articles.length) {
    el.innerHTML = '<div style="color:var(--text-faint);padding:20px">No articles available — click Sync to fetch.</div>';
    return;
  }
  el.innerHTML = articles.slice(0, 24).map(raw => {
    const a = newsField(raw);
    const ts   = a.ts ? new Date(a.ts * 1000) : null;
    const time = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    const pw   = a.power != null ? (a.power * 100).toFixed(0) : null;
    const sent = a.sentiment;
    const sentHtml = sent > 0.08
      ? `<span class="news-sent bull">▲ ${(sent*100).toFixed(0)}%</span>`
      : sent < -0.08
      ? `<span class="news-sent bear">▼ ${Math.abs(sent*100).toFixed(0)}%</span>`
      : `<span class="news-sent neut">◆ Neutral</span>`;
    const url = a.url ? a.url.replace(/\\/g,'\\\\').replace(/'/g,"\\'") : '';
    return `<article class="news-card" ${url ? `onclick="window.open('${url}','_blank')" style="cursor:pointer"` : ''}>
      <div class="news-card-head">
        <span class="news-source">${a.source}</span>
        ${pw ? `<span class="news-power">⚡ ${pw}</span>` : ''}
      </div>
      <div class="news-title">${a.title}</div>
      ${a.summary ? `<div class="news-summary">${a.summary}</div>` : ''}
      <div class="news-foot">
        ${a.ticker ? `<span class="news-ticker">${a.ticker}</span>` : ''}
        ${sentHtml}
        <span class="news-time">${time}</span>
      </div>
    </article>`;
  }).join('');
}

// ════ FULL HEATMAP VIEW (legacy flat tiles — kept as fallback) ════════════════
function renderHeatmap() {
  const wrap = document.getElementById('heatWrap');
  if (!wrap) return; // replaced by 3D globe; guard against missing element
  const sectors = (State.heatmap?.sectors || []).filter(
    s => State.layerFilter === 'all' || s.layer === State.layerFilter
  );
  wrap.innerHTML = sectors.map(s => `
    <div class="heat-sector">
      <div class="heat-sector-head">
        <span class="heat-sector-name">${s.name}</span>
        <span class="heat-sector-layer">${s.layer}</span>
        <span class="heat-sector-agg" style="color:${scoreColor(s.aggregate)}">AGG ${fmt(s.aggregate, 3)}</span>
      </div>
      <div class="heat-sector-desc">${s.desc}</div>
      <div class="heat-tiles">
        ${s.tiles.map(t => `
          <div class="heat-tile" style="background:${tileBg(t.net_score)};border-color:${scoreColor(t.net_score)}44"
               onclick="openDrawer('${t.ticker}')">
            <div>
              <div class="heat-tile-sym" style="color:${scoreColor(t.net_score)}">${t.ticker}</div>
              <div class="heat-tile-px">${usd(t.price)}</div>
            </div>
            <div class="heat-tile-foot">
              <span class="heat-tile-action" style="color:${actionColor(t.action)}">${t.action}</span>
              <span class="heat-tile-conv">${t.conviction}%</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ════ OPPORTUNITIES VIEW ════════════════════════════════════════════════════
function renderOpportunities() {
  const list = State.opportunities?.[State.oppTab] || [];
  const isBull = State.oppTab === 'buys';

  // Count header
  const total = list.length;
  const strong = list.filter(o => /STRONG/.test(o.action)).length;

  document.getElementById('oppTable').innerHTML = (total ? `
    <div class="opp-header-stats">
      <span class="opp-hs-count">${total} ${isBull ? '▲ LONG' : '▼ SHORT'} signals</span>
      ${strong ? `<span class="opp-hs-strong">${strong} STRONG conviction</span>` : ''}
      <span class="opp-hs-avg">Avg ${Math.round(list.reduce((s,o)=>s+o.conviction,0)/list.length)}% conviction</span>
    </div>` : '') +
  list.map(o => {
    const col = actionColor(o.action);
    const rr = o.risk_reward;
    const rrColor = rr >= 3 ? 'var(--green)' : rr >= 2 ? 'var(--gold)' : 'var(--text-dim)';
    const signalBadges = (o.signals || []).slice(0, 4).map(s =>
      `<span class="signal-badge">${s}</span>`
    ).join('');
    const convPct = o.conviction || 0;
    const convColor = convPct >= 70 ? 'var(--green)' : convPct >= 50 ? 'var(--gold)' : 'var(--text-dim)';
    return `
    <div class="opp-row" onclick="openDrawer('${o.ticker}')">
      <div class="opp-row-left">
        <div class="opp-row-sym" style="color:${col}">${o.ticker}</div>
        <div class="opp-row-sector">${o.sector || '—'}</div>
      </div>
      <div class="opp-row-action">
        <span class="opp-badge" style="color:${col};background:${actionBg(o.action)}">${o.action}</span>
        ${signalBadges ? `<div class="opp-signal-badges">${signalBadges}</div>` : ''}
      </div>
      <div class="opp-row-levels">
        <div class="opp-metric"><div class="opp-metric-lbl">ENTRY</div><div class="opp-metric-val">${usd(o.entry || o.price)}</div></div>
        <div class="opp-metric"><div class="opp-metric-lbl">TARGET</div><div class="opp-metric-val" style="color:var(--green)">${usd(o.target)}</div></div>
        <div class="opp-metric"><div class="opp-metric-lbl">STOP</div><div class="opp-metric-val" style="color:var(--red)">${usd(o.stop)}</div></div>
        ${rr != null ? `<div class="opp-metric"><div class="opp-metric-lbl">R/R</div><div class="opp-metric-val" style="color:${rrColor}">${Number(rr).toFixed(1)}:1</div></div>` : ''}
      </div>
      <div class="opp-conv-col">
        ${convCircle(convPct, convColor)}
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);padding:20px">No opportunities in this direction.</div>';
}

function convCircle(pct, color) {
  const R = 22, C = 2 * Math.PI * R, dash = C * (pct / 100);
  return `<svg viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="${R}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
    <circle cx="26" cy="26" r="${R}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"
            stroke-dasharray="${dash} ${C}" transform="rotate(-90 26 26)"/>
    <text x="26" y="30" text-anchor="middle" fill="#fff" font-family="JetBrains Mono" font-size="12">${pct}</text>
  </svg>`;
}

// ════ OPTIONS VIEW ══════════════════════════════════════════════════════════
function renderOptions() {
  const all = State.options?.ideas || [];
  const dir = State.optDir || 'all';
  const ideas = dir === 'all' ? all : all.filter(i => i.direction === dir);
  document.getElementById('optExpiry').textContent = `Expiry ${State.options?.expiry || '—'}`;

  // Strategy / direction summary strip
  const sum = State.options?.summary;
  const summaryEl = document.getElementById('optSummary');
  if (summaryEl && sum) {
    const byStrat = sum.by_strategy || {};
    summaryEl.innerHTML = `
      <span class="opt-sum-pill bull">▲ ${sum.bullish || 0} bullish</span>
      <span class="opt-sum-pill bear">▼ ${sum.bearish || 0} bearish</span>
      ${Object.entries(byStrat).map(([k, v]) => `<span class="opt-sum-pill">${k} · ${v}</span>`).join('')}`;
  }

  document.getElementById('optGrid').innerHTML = ideas.map(i => {
    const bull = i.direction === 'bullish';
    const col = bull ? 'var(--green)' : 'var(--red)';
    const spread = i.short_strike != null;
    return `
    <div class="opt-card glass ${bull ? 'call' : 'put'}" onclick="openDrawer('${i.ticker}')">
      <div class="opt-card-head">
        <span class="opt-sym">${i.ticker}</span>
        <span class="opt-dir-badge" style="color:${col};border-color:${col}55">${bull ? '▲ BULL' : '▼ BEAR'}</span>
      </div>
      <div class="opt-strategy" style="color:${col}">${i.strategy}</div>
      <div class="opt-contract">${i.contract}</div>
      <div class="opt-meta">
        <div><span class="opt-meta-lbl">UNDERLYING</span><span class="opt-meta-val">${usd(i.underlying_price)}</span></div>
        <div><span class="opt-meta-lbl">${spread ? 'STRIKES' : 'STRIKE'}</span><span class="opt-meta-val">$${i.strike}${spread ? '/$' + i.short_strike : ''}</span></div>
        <div><span class="opt-meta-lbl">BREAKEVEN</span><span class="opt-meta-val" style="color:var(--cyan)">${i.breakeven != null ? '$' + i.breakeven : '—'}</span></div>
        <div><span class="opt-meta-lbl">CONVICTION</span><span class="opt-meta-val" style="color:${col}">${i.conviction}%</span></div>
      </div>
      <div class="opt-rationale">${i.rationale}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);padding:20px">No options ideas in this direction.</div>';
}

// ════ FLOW STATS HEADER ══════════════════════════════════════════════════════
function renderFlowStats() {
  const el = document.getElementById('flowStatsBar');
  if (!el) return;
  const alerts = (State.briefing?.alerts || []).filter(a =>
    ['WHALE_BLOCK', 'OPTIONS_SWEEP', 'INSIDER_FLOW'].includes(a.type)
  );
  if (!alerts.length) { el.innerHTML = ''; return; }

  let bullNotional = 0, bearNotional = 0;
  let whaleCount = 0, sweepCount = 0, insiderCount = 0;
  alerts.forEach(a => {
    const n = a.data?.size_usd || 0;
    if ((a.data?.direction || 'bullish') === 'bullish') bullNotional += n; else bearNotional += n;
    if (a.type === 'WHALE_BLOCK') whaleCount++;
    else if (a.type === 'OPTIONS_SWEEP') sweepCount++;
    else if (a.type === 'INSIDER_FLOW') insiderCount++;
  });
  const total = bullNotional + bearNotional;
  const bullPct = total > 0 ? Math.round(bullNotional / total * 100) : 50;
  const bearPct = 100 - bullPct;

  el.innerHTML = `
    <div class="flow-stat"><span class="flow-stat-lbl">TOTAL FLOW</span><span class="flow-stat-val">${alerts.length} alerts</span></div>
    <div class="flow-stat"><span class="flow-stat-lbl bullish-lbl">BULL NOTIONAL</span><span class="flow-stat-val bullish-val">${fmtM(bullNotional)}</span></div>
    <div class="flow-stat"><span class="flow-stat-lbl bearish-lbl">BEAR NOTIONAL</span><span class="flow-stat-val bearish-val">${fmtM(bearNotional)}</span></div>
    <div class="flow-stat-divider"></div>
    <div class="flow-stat"><span class="flow-stat-lbl">WHALE BLOCKS</span><span class="flow-stat-val">${whaleCount}</span></div>
    <div class="flow-stat"><span class="flow-stat-lbl">OPT SWEEPS</span><span class="flow-stat-val">${sweepCount}</span></div>
    <div class="flow-stat"><span class="flow-stat-lbl">INSIDER</span><span class="flow-stat-val">${insiderCount}</span></div>
    <div class="flow-stat-divider"></div>
    <div class="flow-bias-bar-wrap">
      <span class="flow-bias-lbl bull">${bullPct}% BULL</span>
      <div class="flow-bias-bar">
        <i class="bull" style="width:${bullPct}%"></i>
        <i class="bear" style="width:${bearPct}%"></i>
      </div>
      <span class="flow-bias-lbl bear">${bearPct}% BEAR</span>
    </div>`;
}

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  return '$' + (v / 1e3).toFixed(0) + 'K';
}

// ════ FLOW VIEW ═════════════════════════════════════════════════════════════
function renderFlow() {
  const all = (State.briefing?.alerts || []).filter(a =>
    ['WHALE_BLOCK', 'OPTIONS_SWEEP', 'INSIDER_FLOW', 'SENTIMENT_SPIKE'].includes(a.type)
  );
  const alerts = all.filter(a => {
    if (State.flowFilter === 'all') return true;
    if (State.flowFilter === 'whale_block') return a.type === 'WHALE_BLOCK';
    if (State.flowFilter === 'options_sweep') return a.type === 'OPTIONS_SWEEP';
    if (State.flowFilter === 'insider_flow') return a.type === 'INSIDER_FLOW';
    return false;
  });

  const typeIcons = {
    WHALE_BLOCK: '🐋',
    OPTIONS_SWEEP: '⚡',
    INSIDER_FLOW: '👁',
    SENTIMENT_SPIKE: '🔥',
  };

  document.getElementById('flowList').innerHTML = alerts.map(a => {
    const d = a.data || {};
    const det = d.details || {};
    const dir = d.direction || 'bullish';
    const col = dir === 'bullish' ? 'var(--green)' : 'var(--red)';
    const colBg = dir === 'bullish' ? 'rgba(31,224,160,0.06)' : 'rgba(255,84,112,0.06)';
    const typeLabel = a.type.replace(/_/g, ' ');
    const typeIco = typeIcons[a.type] || '◈';
    const ts = a.timestamp ? new Date(a.timestamp) : null;
    const timeAgo = ts ? _timeAgo(ts) : '';

    // Detail chips
    const chips = [];
    if (det.volume_ratio != null)      chips.push({ lbl: 'VOL',    val: det.volume_ratio + '×',    hi: det.volume_ratio > 5 });
    if (det.intraday_range_pct != null) chips.push({ lbl: 'RANGE',  val: det.intraday_range_pct + '%' });
    if (det.price_change_pct != null)  chips.push({ lbl: 'Δ PRICE', val: det.price_change_pct + '%', hi: Math.abs(det.price_change_pct) > 3 });
    if (det.strike != null)            chips.push({ lbl: 'STRIKE',  val: '$' + det.strike });
    if (det.expiry)                    chips.push({ lbl: 'EXP',     val: det.expiry });
    if (det.option_type)               chips.push({ lbl: 'TYPE',    val: String(det.option_type).toUpperCase() });
    if (det.open_interest != null)     chips.push({ lbl: 'OI',      val: Number(det.open_interest).toLocaleString() });
    if (det.net_shares != null)        chips.push({ lbl: 'NET SH',  val: Number(det.net_shares).toLocaleString(), hi: Math.abs(det.net_shares) > 100000 });
    if (det.transactions != null)      chips.push({ lbl: 'TXNS',    val: det.transactions });
    if (det.trade_date)                chips.push({ lbl: 'DATE',    val: det.trade_date });

    const chipsHtml = chips.map(c =>
      `<span class="flow-chip${c.hi ? ' hi' : ''}">${c.lbl} <b>${c.val}</b></span>`
    ).join('');

    // Ripple
    const ripple = (d.ripple?.ripple_effects || []).slice(0, 4)
      .map(r => `<span class="flow-ripple-tag" title="${r.tickers?.join(', ')}">${r.sector_name}</span>`).join('');

    // Notional bar (relative visual fill)
    const maxNotional = 100_000_000;
    const notionalPct = Math.min(100, ((d.size_usd || 0) / maxNotional) * 100);

    return `<div class="flow-card ${dir}" style="border-left-color:${col};background:${colBg}" ${d.ticker ? `onclick="openDrawer('${d.ticker}')"` : ''}>
      <div class="flow-card-main">

        <div class="flow-sym-col">
          <div class="flow-sym" style="color:${col}">${d.ticker || '—'}</div>
          <div class="flow-type-badge">${typeIco} ${typeLabel}</div>
          <div class="flow-time-ago">${timeAgo}</div>
        </div>

        <div class="flow-info">
          <div class="flow-info-title">
            <span class="flow-dir-arrow" style="color:${col}">${dir === 'bullish' ? '▲' : '▼'}</span>
            ${a.title}
          </div>
          <div class="flow-info-body">${a.body}</div>
          ${chipsHtml ? `<div class="flow-chips">${chipsHtml}</div>` : ''}
          ${ripple ? `<div class="flow-ripple"><span class="flow-ripple-lbl">RIPPLE →</span>${ripple}</div>` : ''}
        </div>

        <div class="flow-right">
          <div class="flow-prio prio-${a.priority}">${a.priority}</div>
          <div class="flow-notional" style="color:${col}">${fmtM(d.size_usd)}</div>
          <div class="flow-notional-bar"><i style="width:${notionalPct}%;background:${col}"></i></div>
        </div>

      </div>
    </div>`;
  }).join('') || '<div class="flow-empty">No institutional flow detected. Run a sync to scan.</div>';
}

function _timeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ════ DATA SOURCE BADGE ═════════════════════════════════════════════════════
function renderDataBadge() {
  const s = State.dataStatus;
  const badge = document.getElementById('dataBadge');
  const txt = document.getElementById('dataBadgeText');
  if (!badge || !s) return;
  const live = s.mode === 'LIVE';
  badge.classList.toggle('live', live);
  badge.classList.toggle('sim', !live);
  txt.textContent = live ? 'LIVE · FINNHUB' : 'SIM MODE';
  badge.title = live
    ? 'Live market data via Finnhub'
    : 'Simulation mode — add a Finnhub key in engine/config.py for live data';
}

// ════ TICKER TAPE ═══════════════════════════════════════════════════════════
function renderTicker() {
  const tiles = [];
  (State.heatmap?.sectors || []).forEach(s => s.tiles.forEach(t => tiles.push(t)));
  if (!tiles.length) return;
  const html = tiles.map(t => {
    const up = t.net_score >= 0;
    return `<span class="tick">
      <span class="tick-sym">${t.ticker}</span>
      <span class="tick-px">${usd(t.price)}</span>
      <span class="tick-chg ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${fmt(t.net_score, 2)}</span>
    </span>`;
  }).join('');
  document.getElementById('tickerTrack').innerHTML = html + html; // duplicate for seamless loop
}

// ════ NAVIGATION ════════════════════════════════════════════════════════════
function initNav() {
  document.querySelectorAll('.rail-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto));
  });
  // Sub-tabs
  document.querySelectorAll('[data-opp]').forEach(c => c.addEventListener('click', (e) => {
    document.querySelectorAll('[data-opp]').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active'); State.oppTab = e.target.dataset.opp; renderOpportunities();
  }));
  document.querySelectorAll('[data-flow]').forEach(c => c.addEventListener('click', (e) => {
    document.querySelectorAll('[data-flow]').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active'); State.flowFilter = e.target.dataset.flow; renderFlow();
  }));
  document.querySelectorAll('[data-layer]').forEach(c => c.addEventListener('click', (e) => {
    document.querySelectorAll('[data-layer]').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active');
    State.layerFilter = e.target.dataset.layer;
    renderGlobe(State.layerFilter);
  }));
  document.querySelectorAll('[data-news]').forEach(c => c.addEventListener('click', (e) => {
    document.querySelectorAll('[data-news]').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active');
    State.newsTab = e.target.dataset.news;
    renderNews();
  }));
  document.querySelectorAll('[data-optdir]').forEach(c => c.addEventListener('click', (e) => {
    document.querySelectorAll('[data-optdir]').forEach(x => x.classList.remove('active'));
    e.target.classList.add('active');
    State.optDir = e.target.dataset.optdir;
    renderOptions();
  }));
}

function switchView(view) {
  State.view = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.querySelectorAll('.rail-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelector('.stage').scrollTop = 0;

  if (view === 'heatmap') {
    if (!globeInitialized && typeof Globe !== 'undefined' && Globe.create) {
      globeInitialized = true;
      hmGlobe = Globe.create('globeStage', { onClick: openDrawer });
      if (State.heatmap) renderGlobe(State.layerFilter);
    }
  }
  if (view === 'news' && !State.news) {
    loadNews();
  }
}

// ════ BUTTONS ═══════════════════════════════════════════════════════════════
function initButtons() {
  document.getElementById('refreshBtn').addEventListener('click', doSync);
  document.getElementById('briefBtn').addEventListener('click', speakBriefing);
  document.getElementById('voiceBtn').addEventListener('click', () => Voice.startListening(handleVoiceCommand));
  document.getElementById('searchTrigger').addEventListener('click', openPalette);
  initSettings();
}

// ════ SETTINGS / API KEYS ═══════════════════════════════════════════════════
function initSettings() {
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsClose').addEventListener('click', closeSettings);
  // Clicking the SIM/LIVE data badge also opens the key panel.
  const badge = document.getElementById('dataBadge');
  if (badge) { badge.style.cursor = 'pointer'; badge.addEventListener('click', openSettings); }
  document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'settingsOverlay') closeSettings();
  });
  document.getElementById('finnhubKeySave').addEventListener('click', saveFinnhubKey);
  document.getElementById('finnhubKeyClear').addEventListener('click', clearFinnhubKey);
  document.getElementById('finnhubKeyToggle').addEventListener('click', () => {
    const inp = document.getElementById('finnhubKeyInput');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('finnhubKeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveFinnhubKey();
  });

  // X / Twitter token
  document.getElementById('xTokenSave').addEventListener('click', saveXToken);
  document.getElementById('xTokenClear').addEventListener('click', clearXToken);
  document.getElementById('xTokenToggle').addEventListener('click', () => {
    const inp = document.getElementById('xTokenInput');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('xTokenInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveXToken();
  });
}

function openSettings() {
  document.getElementById('settingsOverlay').classList.add('open');
  document.getElementById('settingsMsg').textContent = '';
  document.getElementById('xMsg').textContent = '';
  document.getElementById('finnhubKeyInput').focus();
  renderSettingsStatus(State.dataStatus);
  loadNewsStatus();
}

async function loadNewsStatus() {
  const st = await call('getNewsStatus');
  renderXStatus(st);
}

function renderXStatus(s) {
  const dot = document.querySelector('#xStatus .settings-status-dot');
  const txt = document.getElementById('xStatusText');
  if (!s) return;
  const on = !!s.x;
  if (dot) dot.style.background = on ? 'var(--green)' : 'var(--text-faint)';
  if (txt) txt.innerHTML = on
    ? '<b style="color:var(--green)">ACTIVE</b> — pulling instant headlines from X'
    : '<span style="color:var(--text-dim)">Dormant — add a bearer token to activate</span>';
}
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }

function renderSettingsStatus(s) {
  const dot = document.querySelector('.settings-status-dot');
  const txt = document.getElementById('settingsStatusText');
  if (!s) { if (txt) txt.textContent = 'Status unknown'; return; }
  const live = s.mode === 'LIVE';
  if (dot) dot.style.background = live ? 'var(--green)' : 'var(--gold)';
  if (txt) txt.innerHTML = live
    ? '<b style="color:var(--green)">LIVE</b> — connected to Finnhub'
    : '<b style="color:var(--gold)">SIM</b> — using simulated data (no key yet)';
}

async function saveFinnhubKey() {
  const inp = document.getElementById('finnhubKeyInput');
  const msg = document.getElementById('settingsMsg');
  const key = (inp.value || '').trim();
  if (!key) { msg.innerHTML = '<span style="color:var(--red)">Enter a key first.</span>'; return; }
  msg.innerHTML = '<span style="color:var(--cyan)">Validating with Finnhub…</span>';
  const st = await call('setApiKey', 'finnhub', key);
  State.dataStatus = st;
  renderSettingsStatus(st);
  renderDataBadge();
  if (st?.valid === false) {
    msg.innerHTML = `<span style="color:var(--red)">${st.message || 'Key rejected by Finnhub.'}</span>`;
  } else if (st?.mode === 'LIVE') {
    msg.innerHTML = '<span style="color:var(--green)">✓ Connected. Syncing live data…</span>';
    toast('LIVE', 'Finnhub key saved — JARVIS is now on live data.', 'success');
    setTimeout(() => { closeSettings(); doSync(); }, 900);
  } else {
    msg.innerHTML = '<span style="color:var(--gold)">Saved, but still in SIM mode. Check the key.</span>';
  }
}

async function clearFinnhubKey() {
  document.getElementById('finnhubKeyInput').value = '';
  const st = await call('setApiKey', 'finnhub', '');
  State.dataStatus = st;
  renderSettingsStatus(st);
  renderDataBadge();
  document.getElementById('settingsMsg').innerHTML = '<span style="color:var(--text-dim)">Key cleared — back to SIM mode.</span>';
}

async function saveXToken() {
  const inp = document.getElementById('xTokenInput');
  const msg = document.getElementById('xMsg');
  const tok = (inp.value || '').trim();
  if (!tok) { msg.innerHTML = '<span style="color:var(--red)">Paste a bearer token first.</span>'; return; }
  msg.innerHTML = '<span style="color:var(--cyan)">Validating with X…</span>';
  const st = await call('setApiKey', 'x', tok);
  renderXStatus(st);
  if (st?.valid === false) {
    msg.innerHTML = `<span style="color:var(--red)">${st.message || 'Token rejected by X.'}</span>`;
  } else if (st?.x) {
    msg.innerHTML = `<span style="color:var(--green)">✓ X activated${st.message ? ' — ' + st.message : ''}. Refreshing feed…</span>`;
    toast('X LIVE', 'Breaking-news source activated.', 'success');
    loadNews();
  } else {
    msg.innerHTML = `<span style="color:var(--gold)">${st?.message || 'Saved, but X is not active. Check the token.'}</span>`;
  }
}

async function clearXToken() {
  document.getElementById('xTokenInput').value = '';
  const st = await call('setApiKey', 'x', '');
  renderXStatus(st);
  document.getElementById('xMsg').innerHTML = '<span style="color:var(--text-dim)">Token cleared — X source dormant.</span>';
  loadNews();
}

async function doSync() {
  const btn = document.getElementById('refreshBtn');
  btn.querySelector('.rail-ico').style.animation = 'orbPulse 0.6s infinite';
  toast('Syncing', 'Refreshing market data, sentiment & flow…', 'info');
  await call('triggerBackgroundRefresh');
  await call('runRedditSentiment');
  await call('runFlowScan');
  await new Promise(r => setTimeout(r, 1500));
  await loadAll();
  loadNews();
  btn.querySelector('.rail-ico').style.animation = '';
  toast('Synced', 'All intelligence feeds updated.', 'success');
}

function speakBriefing() {
  const r = State.regime, o = State.opportunities, opts = State.options;
  if (!r) { Voice.speak('Data not ready yet.'); return; }
  const topBuy = o?.buys?.[0];
  const topSell = o?.sells?.[0];
  const topOpt = opts?.ideas?.[0];
  const rotNote = State.rotation?.rotation_signal
    ? 'Sector rotation detected: capital moving from A-I hardware to infrastructure. '
    : '';
  const txt = `Market briefing. The current regime is ${r.regime_label.split('/')[0].trim()}, `
    + `composite score ${r.regime_score.toFixed(2)}, VIX at ${r.vix_level.toFixed(0)}. `
    + rotNote
    + `${o?.buys?.length || 0} long and ${o?.sells?.length || 0} short opportunities flagged. `
    + (topBuy ? `Top long: ${topBuy.action} on ${topBuy.ticker} at ${topBuy.conviction} percent conviction. ` : '')
    + (topSell ? `Top short: ${topSell.ticker} at ${topSell.conviction} percent. ` : '')
    + (topOpt ? `Options: ${topOpt.strategy} on ${topOpt.ticker}. ` : '')
    + `${r.actions?.[0] || ''}`;
  Voice.setHud(true, 'Delivering briefing…');
  Voice.speak(txt);
  setTimeout(() => Voice.setHud(false), 5000);
}

// ════ VOICE COMMANDS ════════════════════════════════════════════════════════
function initVoice() {
  if (!Voice.available) {
    document.getElementById('voiceBtn').title = 'Voice needs Chrome';
  }
}

function handleVoiceCommand(text) {
  const t = text.toLowerCase();
  Voice.setHud(true, `“${text}”`);
  setTimeout(() => Voice.setHud(false), 2500);

  // Navigation
  if (/(heat ?map|sector|globe)/.test(t)) { switchView('heatmap'); return Voice.speak('Opening global sector map.'); }
  if (/(option)/.test(t)) { switchView('options'); return Voice.speak('Showing options ideas, bull and bear.'); }
  if (/(opportunit|idea|buy|sell|long|short)/.test(t) && !/regime/.test(t)) { switchView('opportunities'); return Voice.speak('Here are the opportunities.'); }
  if (/(flow|whale|sweep|institution|insider)/.test(t)) { switchView('flow'); return Voice.speak('Showing institutional flow.'); }
  if (/(news|headline|intel)/.test(t)) { switchView('news'); return Voice.speak('Loading market intelligence.'); }
  if (/(overview|home|dashboard)/.test(t)) { switchView('overview'); return Voice.speak('Back to overview.'); }
  if (/(brief|summary|report|update)/.test(t)) { return speakBriefing(); }
  if (/(sync|refresh|scan|update data)/.test(t)) { return doSync(); }
  if (/rotation/.test(t)) {
    const rot = State.rotation;
    if (!rot) return Voice.speak('Rotation data not ready.');
    return Voice.speak(rot.rotation_signal ? rot.narrative : 'No rotation detected. Market in equilibrium.');
  }
  if (/regime/.test(t)) {
    const r = State.regime;
    return Voice.speak(r ? `The market regime is ${r.regime_label.split('/')[0].trim()}, score ${r.regime_score.toFixed(2)}.` : 'Regime not ready.');
  }
  if (/(dca|watchlist|accumulate)/.test(t)) {
    const top = (State.dca || [])[0];
    return Voice.speak(top ? `Top DCA target: ${top.ticker}, ${top.name}. ${top.rationale}` : 'No DCA candidates available.');
  }

  // Ticker lookup
  const allTickers = [];
  (State.heatmap?.sectors || []).forEach(s => s.tiles.forEach(x => allTickers.push(x.ticker)));
  const found = allTickers.find(sym => new RegExp('\\b' + sym + '\\b', 'i').test(t) || t.includes(sym.toLowerCase()));
  if (found) { openDrawer(found); return; }

  Voice.speak("I didn't catch a known command. Try: show heat maps, options, opportunities, flow, or brief me.");
}

// ════ DETAIL DRAWER ═════════════════════════════════════════════════════════
async function openDrawer(ticker) {
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawerBody').innerHTML = `<div class="drawer-loading">Loading ${ticker}…</div>`;

  const [assess, ripple, news] = await Promise.all([
    call('getTickerAssessment', ticker),
    call('getFlowRipple', ticker),
    call('getCompanyNews', ticker, 6),
  ]);
  if (!assess) {
    document.getElementById('drawerBody').innerHTML = `<div style="color:var(--text-faint);padding:20px">No data for ${ticker}.</div>`;
    return;
  }
  const c = assess.components || {};
  const col = actionColor(assess.action);

  const compBar = (lbl, v) => {
    const sc = scoreColor(v), w = Math.abs(v) * 50, left = v >= 0 ? 50 : 50 - w;
    return `<div class="drawer-comp">
      <span class="drawer-comp-lbl">${lbl}</span>
      <span class="drawer-comp-bar"><i style="left:${left}%;width:${w}%;background:${sc}"></i></span>
      <span class="drawer-comp-val" style="color:${sc}">${fmt(v, 2)}</span>
    </div>`;
  };

  // Options ideas for this ticker
  const tickerOpts = (State.options?.ideas || []).filter(i => i.ticker === ticker);
  const optsHtml = tickerOpts.length ? tickerOpts.map(i => {
    const oc = i.direction === 'bullish' ? 'var(--green)' : 'var(--red)';
    return `<div class="drawer-opt-row">
      <span class="opt-dir-badge" style="color:${oc};border-color:${oc}44;font-size:10px;padding:2px 6px">${i.direction === 'bullish' ? '▲' : '▼'}</span>
      <span style="color:${oc};font-weight:600;font-size:12px">${i.strategy}</span>
      <span style="color:var(--text-dim);font-family:var(--font-mono);font-size:11px">${i.contract}</span>
      <span style="color:var(--cyan);font-family:var(--font-mono);font-size:11px">BE $${i.breakeven ?? '—'}</span>
    </div>`;
  }).join('') : '<div style="color:var(--text-faint);font-size:12px">No options setups for this ticker.</div>';

  // News items (backend returns { items: [...] })
  const newsArr = Array.isArray(news) ? news : (news?.items || news?.articles || []);
  const newsHtml = newsArr.slice(0, 5).map(raw => {
    const a = newsField(raw);
    const sc = a.sentiment > 0.08 ? 'var(--green)' : a.sentiment < -0.08 ? 'var(--red)' : 'var(--text-faint)';
    const ts = a.ts ? _timeAgo(new Date(a.ts * 1000)) : '';
    const url = a.url ? a.url.replace(/'/g, "\\'") : '';
    return `<div class="drawer-news-item" ${url ? `onclick="window.open('${url}','_blank')"` : ''}>
      <div class="drawer-news-head">
        <span class="drawer-news-source">${a.source}</span>
        <span class="drawer-news-time">${ts}</span>
        <span style="color:${sc};font-size:10px">${a.sentiment > 0.08 ? '▲' : a.sentiment < -0.08 ? '▼' : '◆'}</span>
      </div>
      <div class="drawer-news-title">${a.title}</div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);font-size:12px">No recent news found.</div>';

  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-sym" style="color:${col}">${assess.ticker}</div>
    <div class="drawer-sector">${assess.sector || ''}</div>

    <div class="drawer-section">
      <span class="opp-badge" style="color:${col};background:${actionBg(assess.action)};font-size:14px;padding:8px 16px">
        ${assess.action} · ${assess.conviction}% conviction
      </span>
    </div>

    <div class="drawer-section">
      <h4>PRICE LEVELS</h4>
      <div class="drawer-levels">
        <div class="drawer-level"><div class="drawer-level-lbl">ENTRY</div><div class="drawer-level-val">${usd(assess.entry || assess.price)}</div></div>
        <div class="drawer-level"><div class="drawer-level-lbl">TARGET</div><div class="drawer-level-val" style="color:var(--green)">${usd(assess.target)}</div></div>
        <div class="drawer-level"><div class="drawer-level-lbl">STOP</div><div class="drawer-level-val" style="color:var(--red)">${usd(assess.stop)}</div></div>
      </div>
      ${assess.risk_reward != null ? `<div style="text-align:center;margin-top:10px;color:var(--text-dim);font-family:var(--font-mono)">Risk / Reward &nbsp; <b style="color:var(--cyan)">${assess.risk_reward} : 1</b></div>` : ''}
    </div>

    <div class="drawer-section">
      <h4>SIGNAL BREAKDOWN</h4>
      ${compBar('Technical', c.technical)}
      ${compBar('Sentiment', c.sentiment)}
      ${compBar('Flow', c.flow)}
      ${compBar('Regime Fit', c.regime_fit)}
    </div>

    <div class="drawer-section">
      <h4>ACTIVE SIGNALS</h4>
      <div class="drawer-signals">
        ${(assess.signals || []).map(s => `<span class="signal-badge">${s}</span>`).join('') || '<span style="color:var(--text-faint)">No signals.</span>'}
      </div>
    </div>

    <div class="drawer-section">
      <h4>OPTIONS SETUPS</h4>
      <div class="drawer-opts">${optsHtml}</div>
    </div>

    <div class="drawer-section">
      <h4>SUPPLY-CHAIN RIPPLE</h4>
      <div class="drawer-ripple">
        ${(ripple?.ripple_effects || []).map(r => `
          <div class="ripple-node">
            <div class="ripple-node-name">${r.sector_name}</div>
            <div class="ripple-node-tickers">${r.tickers.join(' · ')}</div>
          </div>`).join('') || '<div style="color:var(--text-faint)">No downstream mapping.</div>'}
      </div>
    </div>

    <div class="drawer-section">
      <h4>RECENT NEWS</h4>
      <div class="drawer-news">${newsHtml}</div>
    </div>`;
}

function closeDrawer() { document.getElementById('drawerOverlay').classList.remove('open'); }

// ════ COMMAND PALETTE ═══════════════════════════════════════════════════════
let paletteItems = [], paletteSel = 0;
function initPalette() {
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', (e) => { if (e.target.id === 'drawerOverlay') closeDrawer(); });
  document.getElementById('paletteOverlay').addEventListener('click', (e) => { if (e.target.id === 'paletteOverlay') closePalette(); });
  document.getElementById('paletteInput').addEventListener('input', renderPalette);
}
function openPalette() {
  document.getElementById('paletteOverlay').classList.add('open');
  const inp = document.getElementById('paletteInput');
  inp.value = ''; inp.focus(); paletteSel = 0; renderPalette();
}
function closePalette() { document.getElementById('paletteOverlay').classList.remove('open'); }

function buildPaletteCommands() {
  const cmds = [
    { type: 'cmd', title: 'Go to Overview', sub: 'View', ico: '◳', act: () => switchView('overview') },
    { type: 'cmd', title: 'Go to Heat Maps', sub: 'View', ico: '▦', act: () => switchView('heatmap') },
    { type: 'cmd', title: 'Go to Opportunities', sub: 'View', ico: '◈', act: () => switchView('opportunities') },
    { type: 'cmd', title: 'Go to Options', sub: 'View', ico: '⟐', act: () => switchView('options') },
    { type: 'cmd', title: 'Go to Flow', sub: 'View', ico: '≋', act: () => switchView('flow') },
    { type: 'cmd', title: 'Sync All Data', sub: 'Action', ico: '⟳', act: doSync },
    { type: 'cmd', title: 'Voice Briefing', sub: 'Action', ico: '▶', act: speakBriefing },
  ];
  const tickers = [];
  (State.heatmap?.sectors || []).forEach(s => s.tiles.forEach(t =>
    tickers.push({ type: 'ticker', title: t.ticker, sub: `${s.name} · ${fmt(t.net_score, 2)}`, ico: '$', act: () => openDrawer(t.ticker) })
  ));
  return [...cmds, ...tickers];
}

function renderPalette() {
  const q = document.getElementById('paletteInput').value.toLowerCase();
  const all = buildPaletteCommands();
  paletteItems = q ? all.filter(i => (i.title + ' ' + i.sub).toLowerCase().includes(q)) : all;
  paletteSel = Math.min(paletteSel, Math.max(0, paletteItems.length - 1));
  document.getElementById('paletteResults').innerHTML = paletteItems.map((i, idx) => `
    <div class="palette-item ${idx === paletteSel ? 'sel' : ''}" onclick="runPalette(${idx})">
      <span class="palette-item-ico">${i.ico}</span>
      <div class="palette-item-main">
        <div class="palette-item-title">${i.title}</div>
        <div class="palette-item-sub">${i.sub}</div>
      </div>
    </div>`).join('') || '<div style="padding:20px;color:var(--text-faint)">No matches.</div>';
}
function runPalette(idx) { const it = paletteItems[idx]; if (it) { closePalette(); it.act(); } }

// ════ KEYBOARD ══════════════════════════════════════════════════════════════
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    const palOpen = document.getElementById('paletteOverlay').classList.contains('open');
    // Ctrl/Cmd+K → palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palOpen ? closePalette() : openPalette(); return; }
    if (palOpen) {
      if (e.key === 'Escape') closePalette();
      else if (e.key === 'ArrowDown') { e.preventDefault(); paletteSel = Math.min(paletteSel + 1, paletteItems.length - 1); renderPalette(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); paletteSel = Math.max(paletteSel - 1, 0); renderPalette(); }
      else if (e.key === 'Enter') { e.preventDefault(); runPalette(paletteSel); }
      return;
    }
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'Escape') { closeDrawer(); closeSettings(); Voice.setHud(false); }
    if (e.key === '/') { e.preventDefault(); openPalette(); }
    const map = { '1': 'overview', '2': 'heatmap', '3': 'opportunities', '4': 'options', '5': 'flow', '6': 'news' };
    if (map[e.key]) switchView(map[e.key]);
    if (e.key.toLowerCase() === 'v') Voice.startListening(handleVoiceCommand);
    if (e.key.toLowerCase() === 'b') speakBriefing();
    if (e.key.toLowerCase() === 'r') doSync();
  });
}

// ════ TOAST ═════════════════════════════════════════════════════════════════
function toast(title, body, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(40px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ════ PARTICLES ═════════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, parts = [];
  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < 55; i++) parts.push({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    r: Math.random() * 1.6 + 0.4,
  });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = 'rgba(0,212,255,0.35)'; ctx.fill();
    });
    // connections
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 130) { ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y);
        ctx.strokeStyle = `rgba(0,160,220,${0.10 * (1 - d / 130)})`; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// Expose for inline onclick
window.openDrawer = openDrawer;
window.runPalette = runPalette;
window.JARVIS = { toast, switchView, doSync };
