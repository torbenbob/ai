/* Aufmacher-Szene: ungeordnete Dokumente fliegen in Bob und kommen als geordnete Liste heraus.
   three.js r128, monochrom, Rot nur für Abweichungen. Pausiert außerhalb des Sichtfelds. */
(function () {
  var host = document.getElementById('hero3d');
  if (!host || !window.THREE) return;
  var T = window.THREE;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  var scene = new T.Scene();
  scene.fog = new T.Fog(0x0e0e12, 14, 34);
  var camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
  var look = new T.Vector3(-0.7, 0.2, 0);
  var camBase = new T.Vector3(-2.6, 3.0, 15);

  var WHITE = 0xffffff, RED = 0xcc1922;

  /* Boden: feines Raster für Tiefe */
  var grid = new T.GridHelper(60, 60, 0x2c2d33, 0x1d1e23);
  grid.position.y = -2.4;
  scene.add(grid);

  /* Bob: Würfel mit klaren Kanten */
  var BOB = new T.Vector3(2.6, 0.2, 0);
  var bob = new T.Group();
  bob.position.copy(BOB);
  var cubeGeo = new T.BoxGeometry(1.7, 1.7, 1.7);
  var cubeSolid = new T.Mesh(cubeGeo, new T.MeshBasicMaterial({ color: 0x15161b }));
  var cubeEdges = new T.LineSegments(new T.EdgesGeometry(cubeGeo), new T.LineBasicMaterial({ color: WHITE }));
  var innerGeo = new T.BoxGeometry(0.9, 0.9, 0.9);
  var inner = new T.LineSegments(new T.EdgesGeometry(innerGeo), new T.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.45 }));
  bob.add(cubeSolid, cubeEdges, inner);
  bob.rotation.set(0.35, -0.6, 0);
  scene.add(bob);

  /* Leuchtring beim Aufnehmen */
  var ringGeo = new T.RingGeometry(1.05, 1.1, 64);
  var ring = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, side: T.DoubleSide }));
  ring.position.copy(BOB);
  ring.lookAt(camBase);
  scene.add(ring);
  var pulse = 0;

  /* Dokumente: Rahmen plus drei Textzeilen */
  var docGeo = new T.EdgesGeometry(new T.PlaneGeometry(0.62, 0.84));
  var linePts = [];
  [[0.22, 0.4], [0.08, 0.32], [-0.06, 0.36]].forEach(function (r) {
    linePts.push(new T.Vector3(-0.2, r[0], 0), new T.Vector3(-0.2 + r[1], r[0], 0));
  });
  var textGeo = new T.BufferGeometry().setFromPoints(linePts);
  var docs = [];
  var N = 44;
  function rand(a, b) { return a + Math.random() * (b - a); }
  function resetDoc(d, initial) {
    d.g.position.set(initial ? rand(-16, 0) : rand(-18, -13), rand(-2, 2.6), rand(-4, 3));
    d.g.rotation.set(rand(-1, 1), rand(-1.2, 1.2), rand(-0.8, 0.8));
    d.speed = rand(0.022, 0.04);
    d.bad = Math.random() < 0.16;
    d.frame.material.color.setHex(WHITE);
    d.g.scale.setScalar(1);
  }
  for (var i = 0; i < N; i++) {
    var g = new T.Group();
    var frame = new T.LineSegments(docGeo, new T.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.6 }));
    var text = new T.LineSegments(textGeo, new T.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.35 }));
    g.add(frame, text);
    scene.add(g);
    var d = { g: g, frame: frame, text: text };
    resetDoc(d, true);
    docs.push(d);
  }

  /* Ausgabe: geordnete Liste rechts neben Bob */
  var rows = [];
  var MAXR = 9;
  var LIST = new T.Vector3(4.4, 2.1, 0.2);
  var rowGeo = new T.BoxGeometry(1, 0.05, 0.05);
  function emit(bad) {
    var len = bad ? 1.5 : rand(1.2, 2.3);
    var m = new T.Mesh(rowGeo, new T.MeshBasicMaterial({ color: bad ? RED : WHITE, transparent: true, opacity: 0 }));
    m.scale.x = 0.05;
    m.position.copy(BOB);
    m.userData = { len: len, bad: bad };
    scene.add(m);
    rows.unshift(m);
    if (rows.length > MAXR) {
      var old = rows.pop();
      old.userData.dying = true;
      dying.push(old);
    }
    if (bad) {
      var dot = new T.Mesh(new T.CircleGeometry(0.08, 24), new T.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0 }));
      m.userData.dot = dot;
      scene.add(dot);
    }
  }
  var dying = [];

  /* Größe */
  function size() {
    var w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (camera.aspect < 0.9) {
      camera.fov = 48; camBase.set(1.5, 4.6, 19); look.set(3.2, 1.6, 0);
    } else {
      camera.fov = 34; camBase.set(-2.6, 3.0, 15); look.set(-0.7, 0.2, 0);
    }
    camera.updateProjectionMatrix();
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
  else window.addEventListener('resize', size);

  /* Maus-Parallaxe */
  var mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  var tmp = new T.Vector3();
  var t = 0;
  function step() {
    t += 0.016;
    /* Kamera */
    camera.position.x += (camBase.x + mx * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (camBase.y - my * 0.6 - camera.position.y) * 0.04;
    camera.position.z = camBase.z;
    camera.lookAt(look);

    /* Bob */
    bob.rotation.y += 0.004;
    inner.rotation.x -= 0.01; inner.rotation.y += 0.013;
    bob.position.y = BOB.y + Math.sin(t * 1.4) * 0.08;
    pulse *= 0.92;
    var sc = 1 + pulse * 0.08;
    bob.scale.set(sc, sc, sc);
    ring.material.opacity = pulse * 0.55;
    ring.scale.setScalar(1 + (1 - pulse) * 0.6);

    /* Dokumente */
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i], p = d.g.position;
      p.x += d.speed * (1 + Math.max(0, (p.x + 4) * 0.06));
      var near = Math.min(1, Math.max(0, (p.x + 6) / 8));
      p.y += (BOB.y - p.y) * 0.02 * near;
      p.z += (BOB.z - p.z) * 0.02 * near;
      d.g.rotation.x *= 1 - 0.02 * near;
      d.g.rotation.z *= 1 - 0.02 * near;
      d.g.rotation.y += (-0.6 - d.g.rotation.y) * 0.02 * near;
      if (d.bad && near > 0.5) d.frame.material.color.setHex(RED);
      var dist = tmp.copy(p).sub(BOB).length();
      if (dist < 1.6) d.g.scale.setScalar(Math.max(0.05, (dist - 0.6) / 1.0));
      if (dist < 0.75) {
        pulse = 1;
        emit(d.bad);
        resetDoc(d, false);
      }
    }

    /* Liste */
    for (var r = 0; r < rows.length; r++) {
      var m = rows[r], u = m.userData;
      var tx = LIST.x + u.len / 2, ty = LIST.y - r * 0.36;
      m.position.x += (tx - m.position.x) * 0.08;
      m.position.y += (ty - m.position.y) * 0.08;
      m.position.z += (LIST.z - m.position.z) * 0.08;
      m.scale.x += (u.len - m.scale.x) * 0.08;
      m.material.opacity += ((u.bad ? 1 : 0.85) - m.material.opacity) * 0.08;
      if (u.dot) {
        u.dot.position.set(LIST.x - 0.28, m.position.y, m.position.z);
        u.dot.lookAt(camera.position);
        u.dot.material.opacity = m.material.opacity;
      }
    }
    for (var k = dying.length - 1; k >= 0; k--) {
      var o = dying[k];
      o.material.opacity *= 0.9;
      o.position.y -= 0.02;
      if (o.userData.dot) o.userData.dot.material.opacity = o.material.opacity;
      if (o.material.opacity < 0.02) {
        scene.remove(o);
        o.material.dispose();
        if (o.userData.dot) { scene.remove(o.userData.dot); o.userData.dot.geometry.dispose(); o.userData.dot.material.dispose(); }
        dying.splice(k, 1);
      }
    }
    renderer.render(scene, camera);
  }

  /* Startzustand: Liste vorbefüllen, damit das erste Bild vollständig ist */
  for (var s = 0; s < MAXR; s++) emit(s === 2 || s === 6);
  for (var w = 0; w < 140; w++) step();

  if (reduce) { renderer.render(scene, camera); return; }

  var running = false, raf = 0;
  function loop() { step(); raf = requestAnimationFrame(loop); }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.05 }).observe(host);
  } else start();
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
