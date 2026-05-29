/* ═══════════════════════════════════════════════════════════════════════
   JARVIS 3D Market Globe — Three.js rotating intelligence map
   ═══════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  // Company HQ coordinates [lat, lon]
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

  let scene, camera, renderer, pivot, tooltip, container;
  let markerMeshes = [], markerInfos = [], extraMeshes = [], ringMeshes = [], ringPhases = [];
  let raycaster, mouse, hoveredInfo = null;
  let rotX = 0.25, rotY = -0.4;
  let dragging = false, lastX = 0, lastY = 0;
  let spinning = true, spinTimer = null;
  let onClickCb = null, ready = false;

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

  function init(containerId, clickCb) {
    if (typeof THREE === 'undefined') { console.warn('[Globe] THREE not loaded'); return; }
    container = document.getElementById(containerId);
    if (!container || ready) return;
    ready = true;
    onClickCb = clickCb;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 3.1;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Stars field
    const sp = [];
    for (let i = 0; i < 5200; i++) {
      const r = 9 + Math.random() * 6;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      sp.push(r*Math.sin(b)*Math.cos(a), r*Math.sin(b)*Math.sin(a), r*Math.cos(b));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.013, transparent: true, opacity: 0.7,
    })));

    // Pivot (globe + markers rotate as one)
    pivot = new THREE.Group();
    scene.add(pivot);

    // Globe body
    pivot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 72, 72),
      new THREE.MeshPhongMaterial({ color: 0x010d1e, emissive: 0x001122, shininess: 22, transparent: true, opacity: 0.97 })
    ));

    // Wireframe grid overlay
    pivot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.005, 40, 20),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.032 })
    ));

    // Latitude rings
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lon = 0; lon <= 360; lon += 3) pts.push(toVec3(lat, lon - 180, 1.007));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      pivot.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x00aacc, transparent: true, opacity: 0.10 })));
    }
    // Meridian lines
    for (let lon = 0; lon < 360; lon += 60) {
      const pts = [];
      for (let lat = -88; lat <= 88; lat += 4) pts.push(toVec3(lat, lon - 180, 1.007));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      pivot.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x00aacc, transparent: true, opacity: 0.06 })));
    }

    // Atmosphere glow (outside pivot — static)
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.055, side: THREE.BackSide })
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.28, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x003388, transparent: true, opacity: 0.022, side: THREE.BackSide })
    ));

    // Lighting
    scene.add(new THREE.AmbientLight(0x0d2040, 1.3));
    const dl = new THREE.DirectionalLight(0x44bbff, 1.1);
    dl.position.set(4, 3, 6);
    scene.add(dl);
    const bl = new THREE.DirectionalLight(0x001a44, 0.5);
    bl.position.set(-4, -2, -5);
    scene.add(bl);

    // Tooltip overlay
    tooltip = document.createElement('div');
    Object.assign(tooltip.style, {
      position: 'absolute', display: 'none', pointerEvents: 'none',
      background: 'rgba(4,7,13,0.94)',
      border: '1px solid rgba(0,212,255,0.55)',
      borderRadius: '10px', padding: '12px 16px',
      fontFamily: 'Rajdhani,sans-serif', color: '#d8eeff',
      zIndex: '200', minWidth: '160px', maxWidth: '220px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 0 28px rgba(0,212,255,0.20), 0 4px 20px rgba(0,0,0,0.5)',
    });
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(tooltip);

    // Pointer events
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => {
      dragging = true; spinning = false; clearTimeout(spinTimer);
      lastX = e.clientX; lastY = e.clientY;
    });
    el.addEventListener('pointermove', e => {
      if (dragging) {
        rotY += (e.clientX - lastX) * 0.005;
        rotX = Math.max(-1.2, Math.min(1.2, rotX + (e.clientY - lastY) * 0.005));
        lastX = e.clientX; lastY = e.clientY;
      }
      hitTest(e);
    });
    el.addEventListener('pointerup', () => {
      dragging = false;
      spinTimer = setTimeout(() => { spinning = true; }, 3200);
    });
    el.addEventListener('click', () => {
      if (hoveredInfo && onClickCb) onClickCb(hoveredInfo.ticker);
    });
    window.addEventListener('resize', onResize);

    animate();
  }

  function onResize() {
    if (!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function hitTest(e) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(markerMeshes);
    if (hits.length) {
      const info = markerInfos[markerMeshes.indexOf(hits[0].object)];
      hoveredInfo = info || null;
      renderer.domElement.style.cursor = 'pointer';
      if (info) showTip(info, e.clientX, e.clientY);
    } else {
      hoveredInfo = null;
      renderer.domElement.style.cursor = '';
      tooltip.style.display = 'none';
    }
  }

  function showTip(info, cx, cy) {
    const t = info.data;
    const col  = t.net_score >= 0 ? '#1fe0a0' : '#ff5470';
    const sign = t.net_score >= 0 ? '+' : '';
    tooltip.innerHTML = `
      <div style="font-family:Orbitron;font-size:14px;font-weight:700;letter-spacing:1px;margin-bottom:3px">${t.ticker}</div>
      <div style="color:#3a5a78;font-size:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">${t.sector || t.layer || ''}</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
        <span style="color:#8aabb0">$${Number(t.price||0).toLocaleString()}</span>
        <span style="color:${col};font-weight:700">${sign}${Number(t.net_score).toFixed(3)}</span>
      </div>
      <div style="font-size:11px;color:${col};font-weight:600;letter-spacing:.5px;margin-bottom:7px">${t.action}</div>
      <div style="background:rgba(255,255,255,0.07);border-radius:4px;height:4px;overflow:hidden">
        <div style="width:${t.conviction}%;height:100%;background:${col};border-radius:4px"></div>
      </div>
      <div style="font-size:10px;color:#3a5a78;margin-top:3px;text-align:right">${t.conviction}% conviction</div>`;
    const rect = container.getBoundingClientRect();
    let x = cx - rect.left + 16, y = cy - rect.top - 12;
    if (x + 225 > container.clientWidth)  x = cx - rect.left - 225;
    if (y + 150 > container.clientHeight) y = cy - rect.top  - 150;
    if (y < 4) y = 4;
    Object.assign(tooltip.style, { left: x + 'px', top: y + 'px', display: 'block' });
  }

  function setData(tiles, layerFilter) {
    if (!pivot) return;
    // Remove previous markers / extras / rings
    [...markerMeshes, ...extraMeshes, ...ringMeshes].forEach(m => pivot.remove(m));
    markerMeshes = []; markerInfos = []; extraMeshes = []; ringMeshes = []; ringPhases = [];

    tiles.forEach(t => {
      if (layerFilter && layerFilter !== 'all' && t.layer !== layerFilter) return;
      const [lat, lon] = HQ[t.ticker] || [40.71, -74.01];
      const pos = toVec3(lat, lon, 1.027);
      const col = heatColor(t.net_score);
      const sz  = 0.013 + (t.conviction / 100) * 0.028;

      // Primary dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(sz, 14, 14),
        new THREE.MeshBasicMaterial({ color: col })
      );
      dot.position.copy(pos);
      pivot.add(dot);
      markerMeshes.push(dot);
      markerInfos.push({ ticker: t.ticker, data: t });

      // Inner glow
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(sz * 2.0, 10, 10),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16 })
      );
      halo.position.copy(pos);
      pivot.add(halo);
      extraMeshes.push(halo);

      // Outer glow for conviction >= 50
      if (t.conviction >= 50) {
        const outer = new THREE.Mesh(
          new THREE.SphereGeometry(sz * 3.6, 10, 10),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.065 })
        );
        outer.position.copy(pos);
        pivot.add(outer);
        extraMeshes.push(outer);
      }

      // Animated pulse ring for conviction >= 60
      if (t.conviction >= 60) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(sz * 2.3, sz * 3.4, 30),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        );
        ring.position.copy(pos);
        ring.lookAt(pos.clone().multiplyScalar(5));
        pivot.add(ring);
        ringMeshes.push(ring);
        ringPhases.push(Math.random() * Math.PI * 2);
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (spinning) rotY += 0.0013;
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;

    ringMeshes.forEach((ring, i) => {
      ringPhases[i] += 0.044;
      ring.scale.setScalar(1 + 0.48 * Math.sin(ringPhases[i]));
      ring.material.opacity = 0.20 + 0.35 * Math.abs(Math.sin(ringPhases[i]));
    });

    renderer.render(scene, camera);
  }

  w.Globe = { init, setData };
})(window);
