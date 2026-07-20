/* thinkinbubbles — ideating made easy.
   type into the pill, enter: the thought becomes a bubble that shoots into
   the arena and drifts like a lava lamp. drag to place (placing pins it),
   tap one then another to link — linked thoughts are pulled together until
   their goo flows into one blob. double-tap to reword; empty words pop it.

   storage: localStorage "rz.bubbles.v1" =
     { v:1, bubbles:[{ id, text, x, y, pinned, made }], links:[[idA,idB]] }
   x/y are fractions of viewport (0..1) so layouts survive resizes.
   export: json (same shape) or markdown (linked clusters as lists). */
(() => {
  'use strict';

  const KEY = 'rz.bubbles.v1';
  const HINT = 'rz.bubbles.hint';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bubsEl = document.getElementById('bubs');
  const gooEl = document.getElementById('goo');
  const linesEl = document.getElementById('lines');
  const lctx = linesEl.getContext('2d');
  const form = document.getElementById('f');
  const input = document.getElementById('in');
  const hintEl = document.getElementById('hint');
  const fileEl = document.getElementById('file');

  let W = innerWidth, H = innerHeight;
  let bubbles = [];            // {id,text,x,y,vx,vy,r,pinned,made,p1,p2,el,blob}
  let links = [];              // [idA, idB] sorted pairs
  let sel = null;              // selected bubble
  let editing = null;          // bubble in reword mode
  let running = false;

  /* ---- bounds ---- */
  const TOP = 76, SIDE = 60;
  const bottom = () => H - 150;

  /* ---- persistence ---- */
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: 1,
        bubbles: bubbles.map(b => ({
          id: b.id, text: b.text,
          x: +(b.x / W).toFixed(4), y: +(b.y / H).toFixed(4),
          pinned: b.pinned, made: b.made,
        })),
        links,
      }));
    } catch (e) {}
  };

  const load = () => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!d || d.v !== 1 || !Array.isArray(d.bubbles)) return;
    for (const s of d.bubbles) {
      if (!s || typeof s.text !== 'string') continue;
      spawn(s.text, {
        id: s.id, x: s.x * W, y: s.y * H,
        pinned: !!s.pinned, made: s.made, still: true,
      });
    }
    const ids = new Set(bubbles.map(b => b.id));
    if (Array.isArray(d.links))
      links = d.links.filter(l => Array.isArray(l) && ids.has(l[0]) && ids.has(l[1]));
  };

  /* ---- bubble lifecycle ---- */
  const radius = t => Math.max(34, Math.min(96, 22 + Math.sqrt(t.length) * 8.5));
  const clampXY = b => {
    b.x = Math.min(Math.max(b.x, SIDE), W - SIDE);
    b.y = Math.min(Math.max(b.y, TOP), bottom());
  };

  function spawn(text, o = {}) {
    const b = {
      id: o.id || (crypto.randomUUID ? crypto.randomUUID() : 'b' + Date.now() + Math.random()),
      text, r: radius(text),
      x: o.x ?? W / 2, y: o.y ?? H / 2,
      vx: o.vx || 0, vy: o.vy || 0,
      pinned: !!o.pinned, made: o.made || new Date().toISOString().slice(0, 10),
      p1: Math.random() * 6.28, p2: Math.random() * 6.28,
    };
    clampXY(b);
    b.blob = document.createElement('div');
    b.blob.className = 'blob';
    gooEl.appendChild(b.blob);
    b.el = document.createElement('div');
    b.el.className = 'bub';
    b.el.setAttribute('role', 'listitem');
    b.el.tabIndex = 0;
    b.el.textContent = text;
    bubsEl.appendChild(b.el);
    size(b); place(b);
    wireBubble(b);
    bubbles.push(b);
    if (!o.still) wake();
    return b;
  }

  function size(b) {
    const d = b.r * 2 + 'px';
    b.el.style.width = d; b.el.style.height = d;
    b.blob.style.width = d; b.blob.style.height = d;
    b.el.style.fontSize = b.text.length > 60 ? '0.72rem' : '0.82rem';
  }

  function place(b) {
    const t = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
    b.el.style.transform = t;
    b.blob.style.transform = t;
  }

  function pop(b) {
    b.el.remove(); b.blob.remove();
    bubbles = bubbles.filter(x => x !== b);
    links = links.filter(l => l[0] !== b.id && l[1] !== b.id);
    if (sel === b) sel = null;
    save(); wake();
  }

  /* ---- selection & linking ---- */
  const setSel = b => {
    if (sel) sel.el.classList.remove('sel');
    sel = b;
    if (sel) sel.el.classList.add('sel');
  };

  const pair = (a, b) => (a.id < b.id ? [a.id, b.id] : [b.id, a.id]);

  function tap(b) {
    if (!sel || sel === b) { setSel(sel === b ? null : b); return; }
    const p = pair(sel, b);
    const i = links.findIndex(l => l[0] === p[0] && l[1] === p[1]);
    if (i >= 0) links.splice(i, 1); else links.push(p);
    setSel(null);
    save(); wake();
  }

  /* ---- reword ---- */
  function edit(b) {
    editing = b;
    setSel(null);
    b.el.classList.add('edit');
    b.el.contentEditable = 'true';
    b.el.focus();
    const range = document.createRange();
    range.selectNodeContents(b.el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(range);
  }

  function commit(b) {
    if (editing !== b) return;
    editing = null;
    b.el.classList.remove('edit');
    b.el.contentEditable = 'false';
    const t = b.el.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) { pop(b); return; }
    b.text = t; b.el.textContent = t; b.r = radius(t);
    size(b); place(b); save(); wake();
  }

  /* ---- pointer: drag vs tap vs double-tap ---- */
  function wireBubble(b) {
    let px = 0, py = 0, moved = false, lastTap = 0;

    b.el.addEventListener('pointerdown', e => {
      if (editing === b) return;
      if (editing) commit(editing);
      e.preventDefault();
      b.el.setPointerCapture(e.pointerId);
      px = e.clientX; py = e.clientY; moved = false;
    });

    b.el.addEventListener('pointermove', e => {
      if (editing === b || !b.el.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      if (!moved && dx * dx + dy * dy < 36) return;
      moved = true;
      b.el.classList.add('drag');
      b.x += dx; b.y += dy; b.vx = 0; b.vy = 0;
      clampXY(b); place(b);
      px = e.clientX; py = e.clientY;
      wake();
    });

    b.el.addEventListener('pointerup', e => {
      if (editing === b) return;
      b.el.classList.remove('drag');
      if (moved) { b.pinned = true; save(); return; }
      const now = e.timeStamp;
      if (now - lastTap < 320) { lastTap = 0; edit(b); return; }
      lastTap = now;
      tap(b);
    });

    b.el.addEventListener('keydown', e => {
      if (editing === b) {
        if (e.key === 'Enter') { e.preventDefault(); commit(b); }
        if (e.key === 'Escape') { e.preventDefault(); commit(b); }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(b); }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); pop(b); }
    });

    b.el.addEventListener('blur', () => { if (editing === b) commit(b); });
  }

  /* deselect on empty arena press */
  addEventListener('pointerdown', e => {
    if (e.target === document.body) setSel(null);
  });
  addEventListener('keydown', e => {
    if (editing) return;
    if ((e.key === 'Backspace' || e.key === 'Delete') && sel && document.activeElement === document.body) {
      e.preventDefault(); pop(sel);
    }
    if (e.key === 'Escape') setSel(null);
  });

  /* ---- capture ---- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return;
    input.value = '';
    spawn(t, {
      x: W / 2 + (Math.random() - 0.5) * 60,
      y: H - 170,
      vx: (Math.random() - 0.5) * 220,
      vy: -(260 + Math.random() * 160),
    });
    save(); hint();
  });

  /* ---- hint retires itself ---- */
  function hint() {
    if (localStorage.getItem(HINT)) { hintEl.remove(); return; }
    if (bubbles.length >= 3) { localStorage.setItem(HINT, '1'); hintEl.remove(); }
  }

  /* ---- physics: the lava lamp ---- */
  const linked = () => {
    const m = new Map(bubbles.map(b => [b.id, b]));
    return links.map(l => [m.get(l[0]), m.get(l[1])]).filter(l => l[0] && l[1]);
  };

  function step(dt, t) {
    const pairsLinked = linked();
    const isLinked = new Set(links.map(l => l[0] + '|' + l[1]));

    for (const b of bubbles) {
      if (b.pinned) continue;
      if (!reduced) {
        b.vx += Math.sin(t * 0.00021 + b.p1) * 26 * dt;
        b.vy += Math.cos(t * 0.00017 + b.p2) * 30 * dt;   // slow rise & fall
      }
      if (b.x < SIDE + 40) b.vx += (SIDE + 40 - b.x) * 2.2 * dt;
      if (b.x > W - SIDE - 40) b.vx -= (b.x - (W - SIDE - 40)) * 2.2 * dt;
      if (b.y < TOP + 30) b.vy += (TOP + 30 - b.y) * 2.2 * dt;
      if (b.y > bottom() - 20) b.vy -= (b.y - (bottom() - 20)) * 2.2 * dt;
    }

    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i], c = bubbles[j];
        const key = a.id < c.id ? a.id + '|' + c.id : c.id + '|' + a.id;
        const dx = c.x - a.x, dy = c.y - a.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const ux = dx / d, uy = dy / d;
        if (isLinked.has(key)) continue;                   // springs handle these
        const min = a.r + c.r + 30;
        if (d < min) {
          const f = (min - d) * 4.5 * dt;
          if (!a.pinned) { a.vx -= ux * f; a.vy -= uy * f; }
          if (!c.pinned) { c.vx += ux * f; c.vy += uy * f; }
        }
      }
    }

    for (const [a, c] of pairsLinked) {
      const dx = c.x - a.x, dy = c.y - a.y;
      const d = Math.max(Math.hypot(dx, dy), 1);
      const rest = a.r + c.r + 4;                          // close enough to flow
      const f = (d - rest) * 3.2 * dt;
      const ux = dx / d, uy = dy / d;
      if (!a.pinned) { a.vx += ux * f; a.vy += uy * f; }
      if (!c.pinned) { c.vx -= ux * f; c.vy -= uy * f; }
    }

    let energy = 0;
    for (const b of bubbles) {
      if (b.pinned) continue;
      const damp = Math.max(0, 1 - 1.6 * dt);
      b.vx *= damp; b.vy *= damp;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 420) { b.vx *= 420 / sp; b.vy *= 420 / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      clampXY(b); place(b);
      energy = Math.max(energy, sp);
    }
    return energy;
  }

  function drawLinks() {
    lctx.clearRect(0, 0, W, H);
    lctx.strokeStyle = 'rgba(122, 182, 218, 0.5)';
    lctx.lineWidth = 2;
    for (const [a, c] of linked()) {
      lctx.beginPath();
      lctx.moveTo(a.x, a.y);
      lctx.lineTo(c.x, c.y);
      lctx.stroke();
    }
  }

  let last = 0;
  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    const energy = step(dt, t);
    drawLinks();
    if (reduced && energy < 2) { running = false; return; } // settle, then be still
    requestAnimationFrame(frame);
  }

  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  /* ---- export / import ---- */
  const download = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('exj').addEventListener('click', () => {
    save();
    download('thinkinbubbles.json', localStorage.getItem(KEY) || '{"v":1,"bubbles":[],"links":[]}', 'application/json');
  });

  document.getElementById('exm').addEventListener('click', () => {
    // clusters = connected components over links
    const parent = new Map(bubbles.map(b => [b.id, b.id]));
    const find = x => { while (parent.get(x) !== x) x = parent.get(x); return x; };
    for (const [a, c] of links) parent.set(find(a), find(c));
    const groups = new Map();
    for (const b of bubbles) {
      const root = find(b.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(b);
    }
    let md = '# thinkinbubbles\n';
    let n = 0;
    for (const g of groups.values()) {
      if (g.length < 2) continue;
      md += `\n## cluster ${++n}\n`;
      for (const b of g) md += `- ${b.text}\n`;
    }
    const loose = [...groups.values()].filter(g => g.length < 2).flat();
    if (loose.length) {
      md += '\n## loose\n';
      for (const b of loose) md += `- ${b.text}\n`;
    }
    download('thinkinbubbles.md', md, 'text/markdown');
  });

  document.getElementById('imp').addEventListener('click', () => fileEl.click());
  fileEl.addEventListener('change', () => {
    const f = fileEl.files[0];
    if (!f) return;
    f.text().then(txt => {
      const d = JSON.parse(txt);
      if (!d || d.v !== 1 || !Array.isArray(d.bubbles)) return;
      const have = new Set(bubbles.map(b => b.id));
      for (const s of d.bubbles) {
        if (!s || typeof s.text !== 'string' || have.has(s.id)) continue;
        spawn(s.text, { id: s.id, x: s.x * W, y: s.y * H, pinned: !!s.pinned, made: s.made });
      }
      const ids = new Set(bubbles.map(b => b.id));
      if (Array.isArray(d.links))
        for (const l of d.links) {
          if (!Array.isArray(l) || !ids.has(l[0]) || !ids.has(l[1])) continue;
          if (!links.some(x => x[0] === l[0] && x[1] === l[1])) links.push(l);
        }
      save(); wake();
    }).catch(() => {});
    fileEl.value = '';
  });

  /* ---- viewport ---- */
  function resize() {
    W = innerWidth; H = innerHeight;
    linesEl.width = W; linesEl.height = H;
    for (const b of bubbles) { clampXY(b); place(b); }
    drawLinks(); wake();
  }
  addEventListener('resize', resize);
  addEventListener('pagehide', save);

  /* ---- go ---- */
  resize();
  load();
  hint();
  drawLinks();
  wake();
  input.focus();
})();
