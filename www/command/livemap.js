/* ═══════════════════════════════════════════════════════════════════════
   JARVIS LIVE 3D MAP — real-time planetary operations view
   • Day/night terminator computed live from the actual sun position (UTC)
   • Photoreal day texture + night city-lights blend (procedural fallback)
   • 19 global exchanges with LIVE open / pre-market / closed session status
   • Animated great-circle flow arcs: institutional alerts routed HQ ⇄ venue
   • Company conviction markers (shared heat scoring with the Globe view)
   • HUD: world session clocks, exchange board, live flow feed, sun tracking
   • API: LiveMap.create(id, opts) → { setTiles, setAlerts, setRotate,
           isRotating, reset, followSun, setArcs, resize, destroy }
   ═══════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  // ── Major world exchanges ────────────────────────────────────────────────
  // sessions: [start,end] minutes in LOCAL exchange time (lunch breaks = 2 sessions)
  // days: trading weekdays (0=Sun … 6=Sat)
  const WEEKDAYS = [1, 2, 3, 4, 5];
  const EXCHANGES = [
    { id: 'NYSE',    name: 'New York Stock Exchange', city: 'New York',     lat: 40.7069,  lon: -74.0113, tz: 'America/New_York',    sessions: [[570, 960]] },
    { id: 'NASDAQ',  name: 'NASDAQ',                  city: 'New York',     lat: 40.7580,  lon: -73.9855, tz: 'America/New_York',    sessions: [[570, 960]] },
    { id: 'TSX',     name: 'Toronto Stock Exchange',  city: 'Toronto',      lat: 43.6487,  lon: -79.3817, tz: 'America/Toronto',     sessions: [[570, 960]] },
    { id: 'B3',      name: 'B3 Brasil Bolsa',         city: 'São Paulo',    lat: -23.5475, lon: -46.6361, tz: 'America/Sao_Paulo',   sessions: [[600, 1065]] },
    { id: 'LSE',     name: 'London Stock Exchange',   city: 'London',       lat: 51.5155,  lon: -0.0922,  tz: 'Europe/London',       sessions: [[480, 990]] },
    { id: 'ENX',     name: 'Euronext',                city: 'Paris',        lat: 48.8698,  lon: 2.3075,   tz: 'Europe/Paris',        sessions: [[540, 1050]] },
    { id: 'XETRA',   name: 'Deutsche Börse Xetra',    city: 'Frankfurt',    lat: 50.1109,  lon: 8.6821,   tz: 'Europe/Berlin',       sessions: [[540, 1050]] },
    { id: 'SIX',     name: 'SIX Swiss Exchange',      city: 'Zurich',       lat: 47.3769,  lon: 8.5417,   tz: 'Europe/Zurich',       sessions: [[540, 1050]] },
    { id: 'JSE',     name: 'Johannesburg SE',         city: 'Johannesburg', lat: -26.2041, lon: 28.0473,  tz: 'Africa/Johannesburg', sessions: [[540, 1020]] },
    { id: 'TADAWUL', name: 'Saudi Exchange',          city: 'Riyadh',       lat: 24.7136,  lon: 46.6753,  tz: 'Asia/Riyadh',         sessions: [[600, 900]], days: [0, 1, 2, 3, 4] },
    { id: 'NSE',     name: 'National SE of India',    city: 'Mumbai',       lat: 19.0608,  lon: 72.8615,  tz: 'Asia/Kolkata',        sessions: [[555, 930]] },
    { id: 'SGX',     name: 'Singapore Exchange',      city: 'Singapore',    lat: 1.2790,   lon: 103.8500, tz: 'Asia/Singapore',      sessions: [[540, 720], [780, 1020]] },
    { id: 'HKEX',    name: 'Hong Kong Exchange',      city: 'Hong Kong',    lat: 22.2830,  lon: 114.1580, tz: 'Asia/Hong_Kong',      sessions: [[570, 720], [780, 960]] },
    { id: 'SSE',     name: 'Shanghai Stock Exchange', city: 'Shanghai',     lat: 31.2304,  lon: 121.4737, tz: 'Asia/Shanghai',       sessions: [[570, 690], [780, 900]] },
    { id: 'TSE',     name: 'Tokyo Stock Exchange',    city: 'Tokyo',        lat: 35.6821,  lon: 139.7742, tz: 'Asia/Tokyo',          sessions: [[540, 690], [750, 930]] },
    { id: 'KRX',     name: 'Korea Exchange',          city: 'Seoul',        lat: 37.5219,  lon: 126.9245, tz: 'Asia/Seoul',          sessions: [[540, 930]] },
    { id: 'TWSE',    name: 'Taiwan Stock Exchange',   city: 'Taipei',       lat: 25.0330,  lon: 121.5654, tz: 'Asia/Taipei',         sessions: [[540, 810]] },
    { id: 'ASX',     name: 'Australian SE',           city: 'Sydney',       lat: -33.8651, lon: 151.2099, tz: 'Australia/Sydney',    sessions: [[600, 960]] },
    { id: 'NZX',     name: "New Zealand's Exchange",  city: 'Wellington',   lat: -41.2866, lon: 174.7756, tz: 'Pacific/Auckland',    sessions: [[600, 1005]] },
  ];

  const CLOCK_CITIES = [
    { id: 'SYD', label: 'SYDNEY',    tz: 'Australia/Sydney' },
    { id: 'TYO', label: 'TOKYO',     tz: 'Asia/Tokyo' },
    { id: 'HKG', label: 'HONG KONG', tz: 'Asia/Hong_Kong' },
    { id: 'LON', label: 'LONDON',    tz: 'Europe/London' },
    { id: 'NYC', label: 'NEW YORK',  tz: 'America/New_York' },
  ];
  const CITY_EXCH = { SYD: 'ASX', TYO: 'TSE', HKG: 'HKEX', LON: 'LSE', NYC: 'NYSE' };

  // Texture set (threejs.org CDN). Falls back to a procedural globe on error.
  const TEX = {
    day:    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    night:  'https://threejs.org/examples/textures/planets/earth_lights_2048.png',
    clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  };

  // Fallback HQ coordinates if the Globe module isn't loaded
  const HQ_FALLBACK = { NVDA: [37.36, -121.97], AAPL: [37.33, -122.03], MSFT: [47.64, -122.13] };
  function hqOf(ticker) {
    const HQ = (w.Globe && w.Globe.HQ) || HQ_FALLBACK;
    return HQ[ticker] || null;
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────
  function toVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const th  = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(th),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(th)
    );
  }

  // Great-circle interpolation between two unit vectors
  function slerp(a, b, t) {
    const angle = a.angleTo(b);
    if (angle < 1e-6) return a.clone();
    const s = Math.sin(angle);
    return a.clone().multiplyScalar(Math.sin((1 - t) * angle) / s)
      .add(b.clone().multiplyScalar(Math.sin(t * angle) / s));
  }

  function heatColor(score) {
    const v = Math.max(-1, Math.min(1, Number(score) || 0));
    if (v >= 0) {
      return new THREE.Color(
        (255 + (31  - 255) * v) / 255,
        (200 + (224 - 200) * v) / 255,
        (87  + (160 - 87)  * v) / 255
      );
    }
    const t = -v;
    return new THREE.Color(1, (200 + (84 - 200) * t) / 255, (87 + (112 - 87) * t) / 255);
  }

  // ── Live sun position (subsolar point) ───────────────────────────────────
  // Returns { lat, lon } of the point where the sun is directly overhead.
  function subsolarPoint(date) {
    const rad = Math.PI / 180;
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const day = (date.getTime() - start) / 86400000;
    // Solar declination (Cooper approximation)
    const decl = -23.44 * Math.cos(rad * (360 / 365) * (day + 10));
    // Equation of time (minutes)
    const B = rad * (360 / 365) * (day - 81);
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    let lon = -15 * (utcH - 12 + eot / 60);
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    return { lat: decl, lon };
  }

  // ── Exchange session status via IANA timezones (DST-correct) ────────────
  function localParts(tz, date) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit',
    });
    const parts = {};
    fmt.formatToParts(date || new Date()).forEach(p => { parts[p.type] = p.value; });
    const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      dow: dowMap[parts.weekday],
      mins: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10),
      hhmm: `${(parts.hour === '24' ? '00' : parts.hour)}:${parts.minute}`,
    };
  }

  // → { state: 'OPEN'|'PRE'|'CLOSED', label, localTime, minsLeft }
  function exchangeStatus(ex, date) {
    const { dow, mins, hhmm } = localParts(ex.tz, date);
    const days = ex.days || WEEKDAYS;
    const trading = days.includes(dow);
    if (trading) {
      for (const [a, b] of ex.sessions) {
        if (mins >= a && mins < b) {
          return { state: 'OPEN', label: 'OPEN', localTime: hhmm, minsLeft: b - mins };
        }
      }
      for (const [a] of ex.sessions) {
        if (mins < a && a - mins <= 60) {
          return { state: 'PRE', label: `OPENS ${a - mins}M`, localTime: hhmm, minsLeft: a - mins };
        }
      }
    }
    return { state: 'CLOSED', label: 'CLOSED', localTime: hhmm, minsLeft: 0 };
  }

  const STATE_COLOR = { OPEN: 0x1fe0a0, PRE: 0xffc857, CLOSED: 0x33546e };

  // ══ Factory ═════════════════════════════════════════════════════════════
  function create(containerId, opts) {
    opts = opts || {};
    if (typeof THREE === 'undefined') { console.warn('[LiveMap] THREE not loaded'); return null; }
    const container = document.getElementById(containerId);
    if (!container) { console.warn('[LiveMap] container not found:', containerId); return null; }

    const onClickCb = opts.onClick || null;
    let rafId = null;

    function W() { return container.clientWidth  || 1; }
    function H() { return container.clientHeight || 1; }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W(), H());
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 100);
    camera.position.z = 3.0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ── Star field ──────────────────────────────────────────────────────
    const sp = [];
    for (let i = 0; i < 7000; i++) {
      const r = 12 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      sp.push(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xbfdfff, size: 0.02, transparent: true, opacity: 0.7, sizeAttenuation: true,
    })));

    // ── Pivot: everything pinned to the planet rotates together ─────────
    const pivot = new THREE.Group();
    scene.add(pivot);

    // ── Earth: live day/night shader ─────────────────────────────────────
    // texMode: 0 = procedural, 1 = day only, 2 = day + night lights
    const earthUniforms = {
      dayMap:   { value: null },
      nightMap: { value: null },
      sunDir:   { value: new THREE.Vector3(1, 0, 0) },   // planet-local space
      texMode:  { value: 0 },
    };
    const earthMat = new THREE.ShaderMaterial({
      uniforms: earthUniforms,
      vertexShader: `
        varying vec2 vUv; varying vec3 vN;
        void main(){
          vUv = uv;
          vN = normalize(position);   // unit sphere: object-space normal
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D dayMap; uniform sampler2D nightMap;
        uniform vec3 sunDir; uniform float texMode;
        varying vec2 vUv; varying vec3 vN;
        void main(){
          float d = dot(normalize(vN), normalize(sunDir));
          float t = smoothstep(-0.12, 0.22, d);          // soft terminator band
          vec3 col;
          if (texMode > 1.5) {
            vec3 day   = texture2D(dayMap, vUv).rgb;
            vec3 night = texture2D(nightMap, vUv).rgb;
            night = night * vec3(1.15, 0.98, 0.72) * 1.7 + vec3(0.010, 0.026, 0.052);
            col = mix(night, day * (0.35 + 0.75 * t), t);
          } else if (texMode > 0.5) {
            vec3 day = texture2D(dayMap, vUv).rgb;
            col = mix(day * 0.12 + vec3(0.004, 0.012, 0.028), day * (0.35 + 0.75 * t), t);
          } else {
            vec3 dayC   = vec3(0.07, 0.19, 0.33);
            vec3 nightC = vec3(0.024, 0.055, 0.10);
            col = mix(nightC, dayC * (0.4 + 0.7 * t), t);
          }
          // warm glow right on the terminator line
          float rim = 1.0 - smoothstep(0.0, 0.16, abs(d));
          col += vec3(0.22, 0.11, 0.02) * rim * 0.35;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMat);
    pivot.add(earth);

    // Subtle graticule
    pivot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 36, 24),
      new THREE.MeshBasicMaterial({ color: 0x2bd4ff, wireframe: true, transparent: true, opacity: 0.045 })
    ));

    // Equatorial accent ring (orbital HUD feel)
    const eqRing = new THREE.Mesh(
      new THREE.RingGeometry(1.30, 1.306, 128),
      new THREE.MeshBasicMaterial({ color: 0x2bd4ff, transparent: true, opacity: 0.10, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    eqRing.rotation.x = Math.PI / 2 + 0.35;
    scene.add(eqRing);

    // Clouds (day side only look is approximated by low opacity)
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.014, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    );
    pivot.add(cloudMesh);

    try {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(TEX.day, (t) => {
        earthUniforms.dayMap.value = t;
        earthUniforms.texMode.value = Math.max(earthUniforms.texMode.value, 1);
        loader.load(TEX.night, (n) => {
          earthUniforms.nightMap.value = n;
          earthUniforms.texMode.value = 2;
        }, undefined, () => {});
      }, undefined, () => {});
      loader.load(TEX.clouds, (c) => {
        cloudMesh.material.map = c;
        cloudMesh.material.opacity = 0.30;
        cloudMesh.material.needsUpdate = true;
      }, undefined, () => {});
    } catch (e) { /* offline → procedural */ }

    // ── Atmosphere rim glow ──────────────────────────────────────────────
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.21, 64, 64), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { c: { value: 0.55 }, p: { value: 4.4 }, glow: { value: new THREE.Color(0x3aa8ff) } },
      vertexShader: `
        varying vec3 vN;
        void main(){ vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vN; uniform float c; uniform float p; uniform vec3 glow;
        void main(){ float i = pow(c - dot(vN, vec3(0,0,1.0)), p);
          gl_FragColor = vec4(glow, 1.0) * i; }`,
    })));

    // ── Lighting: sun-tracked key light + cool fill ──────────────────────
    scene.add(new THREE.AmbientLight(0x294a6b, 0.9));
    const sunLight = new THREE.DirectionalLight(0xfff2d8, 1.3);
    scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x2b6cff, 0.4);
    fill.position.set(-5, -2, -4);
    scene.add(fill);

    // ── Exchange markers ─────────────────────────────────────────────────
    const exchGroup = new THREE.Group();
    pivot.add(exchGroup);
    const exchMeshes = [];   // hit targets
    const exchNodes  = [];   // { ex, core, ring, halo, phase, status }

    EXCHANGES.forEach(ex => {
      const pos  = toVec3(ex.lat, ex.lon, 1.022);
      const surf = toVec3(ex.lat, ex.lon, 1.0);

      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([surf, pos]),
        new THREE.LineBasicMaterial({ color: 0x2bd4ff, transparent: true, opacity: 0.35 })
      );
      exchGroup.add(stem);

      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.017, 0),
        new THREE.MeshBasicMaterial({ color: STATE_COLOR.CLOSED })
      );
      core.position.copy(pos);
      exchGroup.add(core);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.030, 12, 12),
        new THREE.MeshBasicMaterial({ color: STATE_COLOR.CLOSED, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
      );
      halo.position.copy(pos);
      exchGroup.add(halo);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.028, 0.042, 32),
        new THREE.MeshBasicMaterial({ color: STATE_COLOR.CLOSED, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(5));
      exchGroup.add(ring);

      exchMeshes.push(core);
      exchNodes.push({ ex, core, ring, halo, phase: Math.random() * Math.PI * 2, status: null });
    });

    function refreshExchangeStatus() {
      const now = new Date();
      exchNodes.forEach(n => {
        n.status = exchangeStatus(n.ex, now);
        const col = STATE_COLOR[n.status.state];
        n.core.material.color.setHex(col);
        n.halo.material.color.setHex(col);
        n.ring.material.color.setHex(col);
      });
      renderExchangeBoard();
    }

    // ── Company conviction markers ────────────────────────────────────────
    const tileGroup = new THREE.Group();
    pivot.add(tileGroup);
    let tileMeshes = [], tileInfos = [];

    function setTiles(tiles) {
      tileGroup.children.slice().forEach(m => {
        tileGroup.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
      tileMeshes = []; tileInfos = [];
      (tiles || []).forEach(t => {
        const hq = hqOf(t.ticker);
        if (!hq) return;
        const pos = toVec3(hq[0], hq[1], 1.012);
        const col = heatColor(t.net_score);
        const sz  = 0.008 + ((t.conviction || 0) / 100) * 0.016;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(sz, 12, 12),
          new THREE.MeshBasicMaterial({ color: col })
        );
        dot.position.copy(pos);
        tileGroup.add(dot);
        tileMeshes.push(dot);
        tileInfos.push({ ticker: t.ticker, data: t });

        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(sz * 2, 10, 10),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })
        );
        halo.position.copy(pos);
        tileGroup.add(halo);
      });
    }

    // ── Flow arcs (institutional alerts) ─────────────────────────────────
    const arcGroup = new THREE.Group();
    pivot.add(arcGroup);
    let arcs = [];          // { line, pulse, pts, speed, t0, ring, ringPhase, info }
    let arcsVisible = true;

    function buildArcPoints(fromLL, toLL) {
      const a = toVec3(fromLL[0], fromLL[1], 1).normalize();
      const b = toVec3(toLL[0], toLL[1], 1).normalize();
      const angle = a.angleTo(b);
      const lift = 0.06 + angle * 0.16;
      const pts = [];
      const N = 72;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const r = 1.015 + Math.sin(Math.PI * t) * lift;
        pts.push(slerp(a, b, t).multiplyScalar(r));
      }
      return pts;
    }

    function clearArcs() {
      arcGroup.children.slice().forEach(m => {
        arcGroup.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
      arcs = [];
    }

    // Arc colors carry meaning: type picks the palette, direction picks the hue.
    const ARC_COLORS = {
      WHALE_BLOCK:   { bull: 0x1fe0a0, bear: 0xff5470 },   // green / red
      OPTIONS_SWEEP: { bull: 0x2bd4ff, bear: 0xe879f9 },   // cyan  / magenta
      INSIDER_FLOW:  { bull: 0xffc857, bear: 0xff9f45 },   // gold  / amber
    };

    // Route an alert: bullish flow streams INTO the listing venue,
    // bearish flow streams OUT of it (distribution).
    function setAlerts(alerts) {
      clearArcs();
      const seen = new Set();
      const flows = (alerts || []).filter(a => {
        if (!['WHALE_BLOCK', 'OPTIONS_SWEEP', 'INSIDER_FLOW'].includes(a.type) || !a.data || !a.data.ticker) return false;
        const sig = `${a.type}|${a.data.ticker}|${a.data.direction}|${a.data.size_usd}`;
        if (seen.has(sig)) return false;   // repeated scans can double-write alerts
        seen.add(sig);
        return true;
      }).slice(0, 24);

      const nyse = EXCHANGES[0];
      flows.forEach((a, i) => {
        const hq = hqOf(a.data.ticker);
        if (!hq) return;
        const bull = /buy|bull|accum|call/i.test(String(a.data.direction || a.title || ''));
        const pal  = ARC_COLORS[a.type] || ARC_COLORS.WHALE_BLOCK;
        const col  = bull ? pal.bull : pal.bear;
        const from = bull ? hq : [nyse.lat, nyse.lon];
        const to   = bull ? [nyse.lat, nyse.lon] : hq;
        const pts  = buildArcPoints(from, to);

        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending })
        );
        arcGroup.add(line);

        const pulse = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 8, 8),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
        );
        pulse.position.copy(pts[0]);
        arcGroup.add(pulse);

        const dest = pts[pts.length - 1];
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.02, 0.032, 32),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
        );
        ring.position.copy(dest.clone().normalize().multiplyScalar(1.012));
        ring.lookAt(ring.position.clone().multiplyScalar(5));
        arcGroup.add(ring);

        arcs.push({
          line, pulse, ring, pts,
          speed: 0.0022 + Math.random() * 0.0022,
          t0: (i * 0.13) % 1,
          ringPhase: Math.random() * Math.PI * 2,
          info: a,
        });
      });
      applyLayerVisibility();
      renderFlowFeed(flows);
      updateStatCounters();
    }

    function setArcs(on) { arcsVisible = !!on; applyLayerVisibility(); }

    // ── Layer modes: globe (all) · heat (tiles) · events (venues) · routes ──
    let mode = 'globe';
    function applyLayerVisibility() {
      tileGroup.visible = mode === 'globe' || mode === 'heat';
      exchGroup.visible = mode === 'globe' || mode === 'events';
      arcGroup.visible  = arcsVisible && (mode === 'globe' || mode === 'routes');
    }
    function setMode(m) {
      mode = ['globe', 'heat', 'events', 'routes'].includes(m) ? m : 'globe';
      applyLayerVisibility();
      return mode;
    }

    // ── Tooltip ──────────────────────────────────────────────────────────
    const tooltip = document.createElement('div');
    tooltip.className = 'globe-tooltip';
    Object.assign(tooltip.style, {
      position: 'absolute', display: 'none', pointerEvents: 'none',
      background: 'rgba(4,8,16,0.95)', border: '1px solid rgba(0,212,255,0.55)',
      borderRadius: '10px', padding: '11px 14px',
      fontFamily: 'Rajdhani,sans-serif', color: '#d8eeff',
      zIndex: '40', minWidth: '170px', maxWidth: '240px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 0 28px rgba(0,212,255,0.22), 0 4px 20px rgba(0,0,0,0.55)',
    });
    container.appendChild(tooltip);

    function showExchangeTip(node, cx, cy) {
      const s = node.status || exchangeStatus(node.ex, new Date());
      const col = s.state === 'OPEN' ? '#1fe0a0' : s.state === 'PRE' ? '#ffc857' : '#5b7a93';
      const cd = s.state === 'OPEN'
        ? `closes in ${Math.floor(s.minsLeft / 60)}h ${s.minsLeft % 60}m`
        : s.state === 'PRE' ? `opens in ${s.minsLeft}m` : 'session closed';
      tooltip.innerHTML = `
        <div style="font-family:Orbitron;font-size:13px;font-weight:700;letter-spacing:1px;margin-bottom:2px">${node.ex.id}</div>
        <div style="color:#3a5a78;font-size:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${node.ex.name}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:#8aabb0">${node.ex.city}</span>
          <span style="color:#d8eeff;font-family:'JetBrains Mono',monospace">${s.localTime}</span>
        </div>
        <div style="font-size:12px;color:${col};font-weight:700;letter-spacing:.5px">● ${s.state}</div>
        <div style="font-size:10px;color:#3a5a78;margin-top:2px">${cd}</div>`;
      placeTip(cx, cy);
    }

    function showTickerTip(info, cx, cy) {
      const t = info.data;
      const col  = t.net_score >= 0 ? '#1fe0a0' : '#ff5470';
      const sign = t.net_score >= 0 ? '+' : '';
      tooltip.innerHTML = `
        <div style="font-family:Orbitron;font-size:14px;font-weight:700;letter-spacing:1px;margin-bottom:2px">${t.ticker}</div>
        <div style="color:#3a5a78;font-size:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${t.sector || t.layer || ''}</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
          <span style="color:#8aabb0">$${Number(t.price || 0).toLocaleString()}</span>
          <span style="color:${col};font-weight:700">${sign}${Number(t.net_score).toFixed(3)}</span>
        </div>
        <div style="font-size:11px;color:${col};font-weight:600;letter-spacing:.5px">${t.action || ''}</div>`;
      placeTip(cx, cy);
    }

    function placeTip(cx, cy) {
      const rect = container.getBoundingClientRect();
      let x = cx - rect.left + 16, y = cy - rect.top - 12;
      if (x + 250 > W()) x = cx - rect.left - 250;
      if (y + 150 > H()) y = cy - rect.top - 150;
      if (y < 4) y = 4;
      Object.assign(tooltip.style, { left: x + 'px', top: y + 'px', display: 'block' });
    }

    // ── Pointer interaction ──────────────────────────────────────────────
    let rotX = 0.30, rotY = -0.55;
    let dragging = false, lastX = 0, lastY = 0, moved = 0;
    let spinning = true, spinTimer = null;
    let followingSun = false;
    let hovered = null;   // { kind:'exchange'|'ticker', ... }

    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; spinning = false; followingSun = false; syncFollowBtn();
      clearTimeout(spinTimer);
      lastX = e.clientX; lastY = e.clientY; el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', e => {
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        rotY += dx * 0.005;
        rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.005));
        lastX = e.clientX; lastY = e.clientY;
      }
      hitTest(e);
    });
    el.addEventListener('pointerup', () => {
      dragging = false; el.style.cursor = 'grab';
      spinTimer = setTimeout(() => { if (!followingSun) spinning = true; }, 3500);
    });
    el.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });
    el.addEventListener('click', () => {
      if (moved >= 6 || !hovered) return;
      if (hovered.kind === 'ticker' && onClickCb) onClickCb(hovered.info.ticker);
    });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      camera.position.z = Math.max(1.7, Math.min(5.5, camera.position.z + e.deltaY * 0.0016));
    }, { passive: false });

    function hitTest(e) {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const exHits = raycaster.intersectObjects(exchMeshes);
      if (exHits.length) {
        const node = exchNodes[exchMeshes.indexOf(exHits[0].object)];
        hovered = { kind: 'exchange', node };
        el.style.cursor = 'pointer';
        showExchangeTip(node, e.clientX, e.clientY);
        return;
      }
      const tHits = raycaster.intersectObjects(tileMeshes);
      if (tHits.length) {
        const info = tileInfos[tileMeshes.indexOf(tHits[0].object)];
        hovered = { kind: 'ticker', info };
        el.style.cursor = 'pointer';
        showTickerTip(info, e.clientX, e.clientY);
        return;
      }
      hovered = null;
      el.style.cursor = dragging ? 'grabbing' : 'grab';
      tooltip.style.display = 'none';
    }

    // ── HUD: session clocks · exchange board · flow feed · stats ─────────
    function renderClocks() {
      const elc = document.getElementById('lmClocks');
      if (!elc) return;
      const now = new Date();
      elc.innerHTML = CLOCK_CITIES.map(c => {
        const p = localParts(c.tz, now);
        const ex = EXCHANGES.find(x => x.id === CITY_EXCH[c.id]);
        const st = ex ? exchangeStatus(ex, now).state : 'CLOSED';
        const cls = st === 'OPEN' ? 'open' : st === 'PRE' ? 'pre' : '';
        return `<div class="lm-clock ${cls}">
          <span class="lm-clock-dot"></span>
          <span class="lm-clock-city">${c.label}</span>
          <span class="lm-clock-time">${p.hhmm}</span>
        </div>`;
      }).join('');
      const utc = document.getElementById('lmUtc');
      if (utc) utc.textContent = 'UTC ' + now.toISOString().slice(11, 19);
    }

    function renderExchangeBoard() {
      const elx = document.getElementById('lmExchList');
      if (!elx) return;
      const rows = exchNodes
        .map(n => ({ n, s: n.status || exchangeStatus(n.ex, new Date()) }))
        .sort((a, b) => {
          const rank = { OPEN: 0, PRE: 1, CLOSED: 2 };
          return rank[a.s.state] - rank[b.s.state] || a.n.ex.id.localeCompare(b.n.ex.id);
        });
      elx.innerHTML = rows.map(({ n, s }) => `
        <div class="lm-exch ${s.state.toLowerCase()}">
          <span class="lm-exch-dot"></span>
          <span class="lm-exch-id">${n.ex.id}</span>
          <span class="lm-exch-city">${n.ex.city}</span>
          <span class="lm-exch-time">${s.localTime}</span>
          <span class="lm-exch-state">${s.state === 'PRE' ? s.label : s.state}</span>
        </div>`).join('');
      updateStatCounters();
    }

    function renderFlowFeed(flows) {
      const elf = document.getElementById('lmFeed');
      if (!elf) return;
      if (!flows || !flows.length) {
        elf.innerHTML = '<div class="lm-feed-empty">No institutional flow in the last 24h. Arcs will appear as whale blocks, sweeps and insider prints land.</div>';
        return;
      }
      elf.innerHTML = flows.map(a => {
        const bull = /buy|bull|accum|call/i.test(String(a.data.direction || a.title || ''));
        const usd = Number(a.data.size_usd || 0);
        const size = usd >= 1e9 ? (usd / 1e9).toFixed(1) + 'B' : usd >= 1e6 ? (usd / 1e6).toFixed(1) + 'M' : (usd / 1e3).toFixed(0) + 'K';
        return `<div class="lm-feed-item ${bull ? 'bull' : 'bear'}" onclick="openDrawer('${a.data.ticker}')">
          <span class="lm-feed-dir">${bull ? '▲' : '▼'}</span>
          <span class="lm-feed-ticker">${a.data.ticker}</span>
          <span class="lm-feed-type">${(a.type || '').replace(/_/g, ' ')}</span>
          <span class="lm-feed-size">$${size}</span>
        </div>`;
      }).join('');
    }

    function updateStatCounters() {
      const open = exchNodes.filter(n => n.status && n.status.state === 'OPEN').length;
      const a = document.getElementById('lmStatOpen');
      const b = document.getElementById('lmStatArcs');
      const c = document.getElementById('lmStatSun');
      if (a) a.textContent = `${open}/${EXCHANGES.length}`;
      if (b) b.textContent = String(arcs.length);
      if (c) {
        const s = subsolarPoint(new Date());
        c.textContent = `${Math.abs(s.lat).toFixed(1)}°${s.lat >= 0 ? 'N' : 'S'} ${Math.abs(s.lon).toFixed(0)}°${s.lon >= 0 ? 'E' : 'W'}`;
      }
    }

    // ── Controls ─────────────────────────────────────────────────────────
    function setRotate(on) { spinning = !!on; if (on) { followingSun = false; syncFollowBtn(); } clearTimeout(spinTimer); }
    function isRotating() { return spinning; }
    function reset() {
      rotX = 0.30; rotY = -0.55; camera.position.z = 3.0;
      spinning = true; followingSun = false; syncFollowBtn();
    }
    function followSun(on) {
      followingSun = on === undefined ? !followingSun : !!on;
      if (followingSun) spinning = false;
      syncFollowBtn();
      return followingSun;
    }
    function syncFollowBtn() {
      const b = document.getElementById('lmFollowSun');
      if (b) b.classList.toggle('active', followingSun);
    }

    window.addEventListener('resize', resize);
    function resize() {
      if (!W() || !H()) return;
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    }

    // ── Live sun update ──────────────────────────────────────────────────
    const localSun = new THREE.Vector3(1, 0, 0);
    function updateSun() {
      const s = subsolarPoint(new Date());
      localSun.copy(toVec3(s.lat, s.lon, 1)).normalize();
      earthUniforms.sunDir.value.copy(localSun);
    }
    updateSun();

    // ── Timers ───────────────────────────────────────────────────────────
    refreshExchangeStatus();
    renderClocks();
    const tClock  = setInterval(renderClocks, 1000);
    const tStatus = setInterval(refreshExchangeStatus, 15000);
    const tSun    = setInterval(updateSun, 30000);

    // ── Render loop (skips when hidden to save CPU) ──────────────────────
    const _wSun = new THREE.Vector3();
    function animate() {
      rafId = requestAnimationFrame(animate);
      if (!container.clientWidth || !container.clientHeight || container.offsetParent === null) return;
      if (renderer.domElement.width !== Math.floor(W() * renderer.getPixelRatio())) resize();

      if (followingSun) {
        // rotate the planet so the subsolar point faces the camera
        const target = Math.atan2(localSun.x, localSun.z);
        let d = target - (pivot.rotation.y % (Math.PI * 2));
        while (d >  Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        rotY = pivot.rotation.y + d * 0.04;
      } else if (spinning) {
        rotY += 0.0011;
      }
      pivot.rotation.x = rotX;
      pivot.rotation.y = rotY;
      cloudMesh.rotation.y += 0.00035;

      // key light follows the real sun (world space = local sun through pivot)
      _wSun.copy(localSun).applyEuler(pivot.rotation);
      sunLight.position.copy(_wSun).multiplyScalar(5);

      // exchange pulses: only OPEN venues ping
      exchNodes.forEach(n => {
        if (!n.status) return;
        if (n.status.state === 'OPEN') {
          n.phase += 0.05;
          const k = 1 + 0.55 * ((Math.sin(n.phase) + 1) / 2);
          n.ring.scale.setScalar(k);
          n.ring.material.opacity = 0.10 + 0.38 * Math.abs(Math.sin(n.phase));
          n.halo.material.opacity = 0.18 + 0.10 * Math.abs(Math.sin(n.phase));
        } else if (n.status.state === 'PRE') {
          n.phase += 0.11;
          n.ring.material.opacity = 0.10 + 0.25 * Math.abs(Math.sin(n.phase));
          n.ring.scale.setScalar(1);
        } else {
          n.ring.material.opacity = 0;
          n.halo.material.opacity = 0.10;
        }
      });

      // flow pulses travel their arcs; destination rings breathe
      arcs.forEach(a => {
        a.t0 = (a.t0 + a.speed) % 1;
        const idx = a.t0 * (a.pts.length - 1);
        const i0 = Math.floor(idx), f = idx - i0;
        const p0 = a.pts[i0], p1 = a.pts[Math.min(i0 + 1, a.pts.length - 1)];
        a.pulse.position.set(
          p0.x + (p1.x - p0.x) * f,
          p0.y + (p1.y - p0.y) * f,
          p0.z + (p1.z - p0.z) * f
        );
        a.pulse.material.opacity = 0.4 + 0.55 * Math.sin(Math.PI * a.t0);
        a.ringPhase += 0.045;
        a.ring.scale.setScalar(1 + 0.6 * ((Math.sin(a.ringPhase) + 1) / 2));
        a.ring.material.opacity = 0.15 + 0.30 * Math.abs(Math.sin(a.ringPhase));
      });

      renderer.render(scene, camera);
    }
    animate();

    return {
      setTiles, setAlerts, setArcs, setMode, setRotate, isRotating, reset, followSun, resize,
      destroy() {
        cancelAnimationFrame(rafId);
        clearInterval(tClock); clearInterval(tStatus); clearInterval(tSun);
        window.removeEventListener('resize', resize);
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.remove();
      },
    };
  }

  w.LiveMap = { create, EXCHANGES, subsolarPoint, exchangeStatus };
})(window);
