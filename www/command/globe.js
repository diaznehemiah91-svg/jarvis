/* ═══════════════════════════════════════════════════════════════════════
   JARVIS 3D Market Globe — premium Three.js intelligence map
   • Photoreal Earth (blue-marble texture) with graceful procedural fallback
   • Atmosphere Fresnel rim-glow, drifting clouds, star field
   • Company markers pinned to HQ lat/lon, colour-coded by conviction score
   • Pulse rings, hover tooltips, click-through, drag-rotate, auto-spin
   • Multi-instance factory:  Globe.create(containerId, { onClick })
   • Back-compat singleton:   Globe.init(id, cb) / Globe.setData(tiles, filter)
   ═══════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  // ── Company HQ coordinates [lat, lon] + display metadata ────────────────
  const HQ = {
    NVDA:[37.36,-121.97], AMD:[37.33,-121.98], TSM:[24.79,120.98],
    ASML:[51.41,5.46],    INTC:[37.39,-121.96], QCOM:[32.88,-117.21],
    AVGO:[37.29,-121.93], MRVL:[37.37,-121.96], ARM:[52.20,0.13],
    MU:[43.62,-116.20],   AMAT:[37.39,-121.96], LRCX:[37.55,-121.99],
    KLAC:[37.42,-121.91], ONTO:[42.56,-71.17],  WOLF:[35.99,-78.90],
    SMCI:[37.31,-121.93], CIEN:[39.22,-76.72],  DELL:[30.51,-97.82],
    HPE:[30.07,-95.43],   NET:[37.78,-122.42],  CRWD:[30.29,-97.74],
    ZS:[37.31,-121.93],   PANW:[37.40,-121.97], DDOG:[40.71,-74.01],
    SNOW:[37.56,-122.31], OKTA:[37.78,-122.42], PLTR:[39.74,-104.98],
    HIMS:[37.78,-122.42], RXRX:[37.65,-122.42], REGN:[41.06,-73.87],
    MRNA:[42.37,-71.10],  IONQ:[38.98,-76.94],  QBTS:[40.39,-111.85],
    RGTI:[37.88,-122.27], ASTS:[32.00,-102.10], RKLB:[33.82,-118.19],
    AAPL:[37.33,-122.03], MSFT:[47.64,-122.13], GOOGL:[37.42,-122.08],
    AMZN:[47.62,-122.34], META:[37.48,-122.15], CRM:[37.79,-122.41],
    NOW:[37.39,-121.96],  ORCL:[30.40,-97.73],  ADBE:[37.33,-121.89],
    ARKG:[40.71,-74.01],  TSLA:[30.22,-97.64],  RIVN:[33.72,-117.83],
    LIN:[40.71,-74.01],   ANET:[37.33,-121.89],
  };

  // Texture set (threejs.org CDN). Falls back to procedural globe on error.
  const TEX = {
    map:    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    spec:   'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  };

  function toVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const th  = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(th),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(th)
    );
  }

  function heatColor(score) {
    const v = Math.max(-1, Math.min(1, score));
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

  // ══ Factory ═════════════════════════════════════════════════════════════
  function createGlobe(containerId, opts) {
    opts = opts || {};
    if (typeof THREE === 'undefined') { console.warn('[Globe] THREE not loaded'); return null; }
    const container = document.getElementById(containerId);
    if (!container) { console.warn('[Globe] container not found:', containerId); return null; }

    let scene, camera, renderer, pivot, globeMesh, cloudMesh, tooltip;
    let markerMeshes = [], markerInfos = [], extraMeshes = [], ringMeshes = [], ringPhases = [];
    let raycaster, mouse, hoveredInfo = null;
    let rotX = 0.32, rotY = -0.5;
    let dragging = false, lastX = 0, lastY = 0, moved = 0;
    let spinning = true, spinTimer = null;
    const onClickCb = opts.onClick || null;
    let rafId = null;

    function W() { return container.clientWidth  || 1; }
    function H() { return container.clientHeight || 1; }

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W(), H());
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(renderer.domElement);

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 100);
    camera.position.z = 3.15;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // ── Star field ──────────────────────────────────────────────────────
    const sp = [];
    for (let i = 0; i < 6000; i++) {
      const r = 12 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      sp.push(r*Math.sin(b)*Math.cos(a), r*Math.sin(b)*Math.sin(a), r*Math.cos(b));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xbfdfff, size: 0.02, transparent: true, opacity: 0.75, sizeAttenuation: true,
    })));

    // ── Pivot (globe + markers rotate together) ─────────────────────────
    pivot = new THREE.Group();
    scene.add(pivot);

    // Procedural base material (used until/if textures load) — dark cyber look
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x0a2138, emissive: 0x04101f, specular: 0x113355,
      shininess: 18, transparent: true, opacity: 1,
    });
    globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), baseMat);
    pivot.add(globeMesh);

    // Graticule overlay (subtle lat/long grid)
    const grid = new THREE.Mesh(
      new THREE.SphereGeometry(1.004, 36, 24),
      new THREE.MeshBasicMaterial({ color: 0x2bd4ff, wireframe: true, transparent: true, opacity: 0.05 })
    );
    pivot.add(grid);

    // Clouds shell (created now, texture applied on load)
    cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.015, 64, 64),
      new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    );
    pivot.add(cloudMesh);

    // ── Attempt to upgrade to photoreal textures ────────────────────────
    try {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(TEX.map, (t) => {
        globeMesh.material = new THREE.MeshPhongMaterial({
          map: t, shininess: 16, specular: 0x223344,
        });
        // specular ocean mask
        loader.load(TEX.spec, (s) => {
          globeMesh.material.specularMap = s;
          globeMesh.material.specular = new THREE.Color(0x445566);
          globeMesh.material.needsUpdate = true;
        }, undefined, () => {});
        globeMesh.material.needsUpdate = true;
      }, undefined, () => { /* keep procedural look */ });

      loader.load(TEX.clouds, (c) => {
        cloudMesh.material.map = c;
        cloudMesh.material.opacity = 0.42;
        cloudMesh.material.needsUpdate = true;
      }, undefined, () => {});
    } catch (e) { /* offline → procedural */ }

    // ── Atmosphere Fresnel rim-glow ─────────────────────────────────────
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { c: { value: 0.55 }, p: { value: 4.2 },
                  glow: { value: new THREE.Color(0x3aa8ff) } },
      vertexShader: `
        varying vec3 vN;
        void main(){ vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vN; uniform float c; uniform float p; uniform vec3 glow;
        void main(){ float i = pow(c - dot(vN, vec3(0,0,1.0)), p);
          gl_FragColor = vec4(glow, 1.0) * i; }`,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.22, 64, 64), atmoMat));
    // soft outer haze
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a2f6e, transparent: true, opacity: 0.05, side: THREE.BackSide })
    ));

    // ── Lighting (sun + cool fill) ──────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x294a6b, 1.15));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.35);
    sun.position.set(5, 2.5, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x2b6cff, 0.55);
    fill.position.set(-5, -2, -4);
    scene.add(fill);

    // ── Tooltip ─────────────────────────────────────────────────────────
    tooltip = document.createElement('div');
    tooltip.className = 'globe-tooltip';
    Object.assign(tooltip.style, {
      position: 'absolute', display: 'none', pointerEvents: 'none',
      background: 'rgba(4,8,16,0.95)', border: '1px solid rgba(0,212,255,0.55)',
      borderRadius: '10px', padding: '11px 14px',
      fontFamily: 'Rajdhani,sans-serif', color: '#d8eeff',
      zIndex: '40', minWidth: '158px', maxWidth: '220px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 0 28px rgba(0,212,255,0.22), 0 4px 20px rgba(0,0,0,0.55)',
    });
    container.appendChild(tooltip);

    // ── Pointer interaction ─────────────────────────────────────────────
    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; spinning = false; clearTimeout(spinTimer);
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
      spinTimer = setTimeout(() => { spinning = true; }, 3500);
    });
    el.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });
    el.addEventListener('click', () => {
      if (moved < 6 && hoveredInfo && onClickCb) onClickCb(hoveredInfo.ticker);
    });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      camera.position.z = Math.max(1.8, Math.min(5.5, camera.position.z + e.deltaY * 0.0016));
    }, { passive: false });

    window.addEventListener('resize', resize);

    function resize() {
      if (!W() || !H()) return;
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    }

    function hitTest(e) {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markerMeshes);
      if (hits.length) {
        hoveredInfo = markerInfos[markerMeshes.indexOf(hits[0].object)] || null;
        el.style.cursor = 'pointer';
        if (hoveredInfo) showTip(hoveredInfo, e.clientX, e.clientY);
      } else {
        hoveredInfo = null;
        el.style.cursor = dragging ? 'grabbing' : 'grab';
        tooltip.style.display = 'none';
      }
    }

    function showTip(info, cx, cy) {
      const t = info.data;
      const col  = t.net_score >= 0 ? '#1fe0a0' : '#ff5470';
      const sign = t.net_score >= 0 ? '+' : '';
      tooltip.innerHTML = `
        <div style="font-family:Orbitron;font-size:14px;font-weight:700;letter-spacing:1px;margin-bottom:2px">${t.ticker}</div>
        <div style="color:#3a5a78;font-size:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${t.sector || t.layer || ''}</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
          <span style="color:#8aabb0">$${Number(t.price||0).toLocaleString()}</span>
          <span style="color:${col};font-weight:700">${sign}${Number(t.net_score).toFixed(3)}</span>
        </div>
        <div style="font-size:11px;color:${col};font-weight:600;letter-spacing:.5px;margin-bottom:7px">${t.action || ''}</div>
        <div style="background:rgba(255,255,255,0.07);border-radius:4px;height:4px;overflow:hidden">
          <div style="width:${t.conviction||0}%;height:100%;background:${col};border-radius:4px"></div>
        </div>
        <div style="font-size:10px;color:#3a5a78;margin-top:3px;text-align:right">${t.conviction||0}% conviction</div>`;
      const rect = container.getBoundingClientRect();
      let x = cx - rect.left + 16, y = cy - rect.top - 12;
      if (x + 230 > W()) x = cx - rect.left - 230;
      if (y + 156 > H()) y = cy - rect.top - 156;
      if (y < 4) y = 4;
      Object.assign(tooltip.style, { left: x + 'px', top: y + 'px', display: 'block' });
    }

    // ── Data → markers ──────────────────────────────────────────────────
    function setData(tiles, layerFilter) {
      [...markerMeshes, ...extraMeshes, ...ringMeshes].forEach(m => {
        pivot.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });
      markerMeshes = []; markerInfos = []; extraMeshes = []; ringMeshes = []; ringPhases = [];

      (tiles || []).forEach(t => {
        if (layerFilter && layerFilter !== 'all' && t.layer !== layerFilter) return;
        const [lat, lon] = HQ[t.ticker] || [40.71, -74.01];
        const surf = toVec3(lat, lon, 1.0);
        const pos  = toVec3(lat, lon, 1.028);
        const col  = heatColor(t.net_score);
        const conv = t.conviction || 0;
        const sz   = 0.012 + (conv / 100) * 0.03;

        // glowing stem from surface to dot
        const stemGeo = new THREE.BufferGeometry().setFromPoints([surf, pos]);
        const stem = new THREE.Line(stemGeo, new THREE.LineBasicMaterial({
          color: col, transparent: true, opacity: 0.5,
        }));
        pivot.add(stem); extraMeshes.push(stem);

        // primary dot
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(sz, 16, 16),
          new THREE.MeshBasicMaterial({ color: col })
        );
        dot.position.copy(pos);
        pivot.add(dot);
        markerMeshes.push(dot);
        markerInfos.push({ ticker: t.ticker, data: t });

        // inner glow
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(sz * 2.1, 12, 12),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending })
        );
        halo.position.copy(pos);
        pivot.add(halo); extraMeshes.push(halo);

        // outer glow for stronger conviction
        if (conv >= 50) {
          const outer = new THREE.Mesh(
            new THREE.SphereGeometry(sz * 3.8, 12, 12),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })
          );
          outer.position.copy(pos);
          pivot.add(outer); extraMeshes.push(outer);
        }

        // animated pulse ring for high conviction
        if (conv >= 60) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(sz * 2.4, sz * 3.5, 32),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55,
              side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
          );
          ring.position.copy(pos);
          ring.lookAt(pos.clone().multiplyScalar(5));
          pivot.add(ring); ringMeshes.push(ring); ringPhases.push(Math.random() * Math.PI * 2);
        }
      });
    }

    // ── Controls ────────────────────────────────────────────────────────
    function setRotate(on) {
      spinning = !!on;
      clearTimeout(spinTimer);
    }
    function isRotating() { return spinning; }
    function reset() {
      rotX = 0.32; rotY = -0.5; camera.position.z = 3.15; spinning = true;
    }

    // ── Render loop (skips when hidden to save CPU) ─────────────────────
    function animate() {
      rafId = requestAnimationFrame(animate);
      if (!container.clientWidth || !container.clientHeight || container.offsetParent === null) return;
      if (renderer.domElement.width !== Math.floor(W() * renderer.getPixelRatio())) resize();

      if (spinning) rotY += 0.0012;
      pivot.rotation.x = rotX;
      pivot.rotation.y = rotY;
      if (cloudMesh) cloudMesh.rotation.y += 0.0004; // independent cloud drift

      ringMeshes.forEach((ring, i) => {
        ringPhases[i] += 0.044;
        ring.scale.setScalar(1 + 0.5 * Math.sin(ringPhases[i]));
        ring.material.opacity = 0.18 + 0.36 * Math.abs(Math.sin(ringPhases[i]));
      });

      renderer.render(scene, camera);
    }
    animate();

    return { setData, setRotate, isRotating, reset, resize,
             destroy() { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize);
                         renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.remove(); } };
  }

  // ── Back-compat singleton API ────────────────────────────────────────────
  let _default = null;
  function init(containerId, clickCb) {
    if (_default) return _default;
    _default = createGlobe(containerId, { onClick: clickCb });
    return _default;
  }
  function setData(tiles, filter) { if (_default) _default.setData(tiles, filter); }

  w.Globe = { create: createGlobe, init, setData, HQ };
})(window);
