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
  view: 'overview',
  oppTab: 'buys',
  flowFilter: 'all',
  layerFilter: 'all',
  newsTab: 'power',
};

let globeInitialized = false;

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
  updateMarketStatus();
  setInterval(updateMarketStatus, 30000);

  await loadAll();
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
  const [sm, regime, opps, opts, heat, brief, status] = await Promise.all([
    call('getSectorMap'),
    call('computeRegime'),
    call('getOpportunities', 16),
    call('getOptionsIdeas', 12),
    call('getSectorHeatmap'),
    call('getFullBriefing'),
    call('getDataStatus'),
  ]);
  State.sectorMap = sm || {};
  State.regime = regime;
  State.opportunities = opps;
  State.options = opts;
  State.heatmap = heat;
  State.briefing = brief;
  State.dataStatus = status;

  renderDataBadge();
  renderTicker();
  renderRegime();
  renderStats();
  renderOverviewOpps();
  renderFeed();
  renderMiniHeat();
  if (globeInitialized) renderGlobe(State.layerFilter);
  renderOpportunities();
  renderOptions();
  renderFlow();
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

// ════ 3D GLOBE VIEW ══════════════════════════════════════════════════════════
function renderGlobe(layerFilter) {
  const allTiles = [];
  (State.heatmap?.sectors || []).forEach(s => {
    s.tiles.forEach(t => allTiles.push({ ...t, layer: s.layer, sector: s.name }));
  });
  if (typeof Globe !== 'undefined') Globe.setData(allTiles, layerFilter || State.layerFilter || 'all');
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
}

function renderNews() {
  const tab  = State.newsTab || 'power';
  const data = State.news?.[tab];
  const articles = Array.isArray(data) ? data : (data?.articles || []);
  const el = document.getElementById('newsGrid');
  if (!el) return;
  if (!articles.length) {
    el.innerHTML = '<div style="color:var(--text-faint);padding:20px">No articles available — click Sync to fetch.</div>';
    return;
  }
  el.innerHTML = articles.slice(0, 24).map(a => {
    const ts   = a.ts ? new Date(a.ts * 1000) : null;
    const time = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    const pw   = a.power_score != null ? (a.power_score * 100).toFixed(0) : null;
    const sent = a.sentiment || 0;
    const sentHtml = sent > 0.08
      ? `<span class="news-sent bull">▲ ${(sent*100).toFixed(0)}%</span>`
      : sent < -0.08
      ? `<span class="news-sent bear">▼ ${Math.abs(sent*100).toFixed(0)}%</span>`
      : `<span class="news-sent neut">◆ Neutral</span>`;
    const url = a.url ? a.url.replace(/\\/g,'\\\\').replace(/'/g,"\\'") : '';
    return `<article class="news-card" ${url ? `onclick="window.open('${url}','_blank')" style="cursor:pointer"` : ''}>
      <div class="news-card-head">
        <span class="news-source">${a.source || 'News'}</span>
        ${pw ? `<span class="news-power">⚡ ${pw}</span>` : ''}
      </div>
      <div class="news-title">${a.title || '—'}</div>
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
  const sectors = (State.heatmap?.sectors || []).filter(
    s => State.layerFilter === 'all' || s.layer === State.layerFilter
  );
  document.getElementById('heatWrap').innerHTML = sectors.map(s => `
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
  document.getElementById('oppTable').innerHTML = list.map(o => `
    <div class="opp-row" onclick="openDrawer('${o.ticker}')">
      <div>
        <div class="opp-row-sym">${o.ticker}</div>
      </div>
      <div>
        <span class="opp-badge" style="color:${actionColor(o.action)};background:${actionBg(o.action)}">${o.action}</span>
      </div>
      <div>
        <div class="opp-row-sector">${o.sector || '—'}</div>
        <div class="opp-signals">${(o.signals || []).slice(0, 2).join(' · ')}</div>
      </div>
      <div class="opp-metric"><div class="opp-metric-lbl">ENTRY</div><div class="opp-metric-val">${usd(o.entry)}</div></div>
      <div class="opp-metric"><div class="opp-metric-lbl">TARGET</div><div class="opp-metric-val" style="color:var(--green)">${usd(o.target)}</div></div>
      <div class="opp-metric"><div class="opp-metric-lbl">STOP</div><div class="opp-metric-val" style="color:var(--red)">${usd(o.stop)}</div></div>
      <div class="opp-conv-circle">${convCircle(o.conviction, actionColor(o.action))}</div>
    </div>`).join('') || '<div style="color:var(--text-faint);padding:20px">No opportunities in this direction.</div>';
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
  const ideas = State.options?.ideas || [];
  document.getElementById('optExpiry').textContent = `Expiry ${State.options?.expiry || '—'}`;
  document.getElementById('optGrid').innerHTML = ideas.map(i => `
    <div class="opt-card glass ${i.type.toLowerCase()}" onclick="openDrawer('${i.ticker}')">
      <div class="opt-card-head">
        <span class="opt-sym">${i.ticker}</span>
        <span class="opt-type ${i.type.toLowerCase()}">${i.type}</span>
      </div>
      <div class="opt-contract">${i.contract}</div>
      <div class="opt-meta">
        <div><span class="opt-meta-lbl">UNDERLYING</span><span class="opt-meta-val">${usd(i.underlying_price)}</span></div>
        <div><span class="opt-meta-lbl">STRIKE</span><span class="opt-meta-val">$${i.strike}</span></div>
        <div><span class="opt-meta-lbl">CONVICTION</span><span class="opt-meta-val" style="color:${i.type==='CALL'?'var(--green)':'var(--red)'}">${i.conviction}%</span></div>
      </div>
      <div class="opt-rationale">${i.rationale}</div>
    </div>`).join('') || '<div style="color:var(--text-faint)">No options ideas.</div>';
}

// ════ FLOW VIEW ═════════════════════════════════════════════════════════════
function renderFlow() {
  const alerts = (State.briefing?.alerts || []).filter(a => {
    if (State.flowFilter === 'all') return ['WHALE_BLOCK', 'OPTIONS_SWEEP', 'INSIDER_FLOW'].includes(a.type);
    if (State.flowFilter === 'whale_block') return a.type === 'WHALE_BLOCK';
    if (State.flowFilter === 'options_sweep') return a.type === 'OPTIONS_SWEEP';
    if (State.flowFilter === 'insider_flow') return a.type === 'INSIDER_FLOW';
    return false;
  });
  document.getElementById('flowList').innerHTML = alerts.map(a => {
    const d = a.data || {};
    const dir = d.direction || 'bullish';
    return `<div class="flow-card ${dir}" ${d.ticker ? `onclick="openDrawer('${d.ticker}')"` : ''}>
      <div class="flow-sym" style="color:${dir==='bullish'?'var(--green)':'var(--red)'}">${d.ticker || '—'}</div>
      <div>
        <div class="flow-info-type">${a.title}</div>
        <div class="flow-info-body">${a.body}</div>
      </div>
      <div>
        <div class="flow-notional">${usd(d.size_usd)}</div>
        <div class="flow-notional-lbl">NOTIONAL</div>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--text-faint);padding:20px">No institutional flow detected. Run a sync to scan.</div>';
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
}

function switchView(view) {
  State.view = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.querySelectorAll('.rail-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelector('.stage').scrollTop = 0;

  if (view === 'heatmap') {
    if (!globeInitialized && typeof Globe !== 'undefined') {
      globeInitialized = true;
      Globe.init('globeStage', openDrawer);
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
  btn.querySelector('.rail-ico').style.animation = '';
  toast('Synced', 'All intelligence feeds updated.', 'success');
}

function speakBriefing() {
  const r = State.regime, o = State.opportunities;
  if (!r) { Voice.speak('Data not ready yet.'); return; }
  const top = o?.buys?.[0];
  const txt = `Market briefing. The current regime is ${r.regime_label.split('/')[0].trim()}, `
    + `with a composite score of ${r.regime_score.toFixed(2)} and the VIX at ${r.vix_level.toFixed(0)}. `
    + `${o?.buys?.length || 0} long and ${o?.sells?.length || 0} short opportunities are flagged. `
    + (top ? `Highest conviction is ${top.action} on ${top.ticker} at ${top.conviction} percent. ` : '')
    + `${r.actions?.[0] || ''}`;
  Voice.setHud(true, 'Delivering briefing…');
  Voice.speak(txt);
  setTimeout(() => Voice.setHud(false), 4000);
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
  if (/(heat ?map|sector)/.test(t)) { switchView('heatmap'); return Voice.speak('Opening sector heat maps.'); }
  if (/(option)/.test(t)) { switchView('options'); return Voice.speak('Showing options ideas.'); }
  if (/(opportunit|idea|buy|sell|long|short)/.test(t) && !/regime/.test(t)) { switchView('opportunities'); return Voice.speak('Here are the opportunities.'); }
  if (/(flow|whale|sweep|institution)/.test(t)) { switchView('flow'); return Voice.speak('Showing institutional flow.'); }
  if (/(overview|home|dashboard)/.test(t)) { switchView('overview'); return Voice.speak('Back to overview.'); }
  if (/(brief|summary|report|update)/.test(t)) { return speakBriefing(); }
  if (/(sync|refresh|scan|update data)/.test(t)) { return doSync(); }
  if (/regime/.test(t)) {
    const r = State.regime;
    return Voice.speak(r ? `The market regime is ${r.regime_label.split('/')[0].trim()}, score ${r.regime_score.toFixed(2)}.` : 'Regime not ready.');
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
  const [assess, ripple] = await Promise.all([
    call('getTickerAssessment', ticker),
    call('getFlowRipple', ticker),
  ]);
  if (!assess) return;
  const c = assess.components || {};
  const compBar = (lbl, v) => {
    const col = scoreColor(v), w = Math.abs(v) * 50, left = v >= 0 ? 50 : 50 - w;
    return `<div class="drawer-comp">
      <span class="drawer-comp-lbl">${lbl}</span>
      <span class="drawer-comp-bar"><i style="left:${left}%;width:${w}%;background:${col}"></i></span>
      <span class="drawer-comp-val" style="color:${col}">${fmt(v, 2)}</span>
    </div>`;
  };
  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-sym" style="color:${actionColor(assess.action)}">${assess.ticker}</div>
    <div class="drawer-sector">${assess.sector || ''}</div>

    <div class="drawer-section">
      <span class="opp-badge" style="color:${actionColor(assess.action)};background:${actionBg(assess.action)};font-size:14px;padding:8px 16px">
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
      ${assess.risk_reward ? `<div style="text-align:center;margin-top:10px;color:var(--text-dim);font-family:var(--font-mono)">Risk / Reward &nbsp; <b style="color:var(--cyan)">${assess.risk_reward} : 1</b></div>` : ''}
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
      ${(assess.signals || []).map(s => `<div class="regime-action"><b>▸</b> ${s}</div>`).join('')}
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
    </div>`;
  document.getElementById('drawerOverlay').classList.add('open');
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
    if (e.key === 'Escape') { closeDrawer(); Voice.setHud(false); }
    if (e.key === '/') { e.preventDefault(); openPalette(); }
    const map = { '1': 'overview', '2': 'heatmap', '3': 'opportunities', '4': 'options', '5': 'flow' };
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
