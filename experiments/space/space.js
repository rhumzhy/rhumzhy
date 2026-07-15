/* space — sound in three axes. x: placement · y: frequency · z: loudness.
   you stand inside a cube: left wall, right wall, back wall, floor, gridded
   in octaves. the room shows the signal after the plugins, so what you edit
   is what you see. eq rides the left wall (low at the floor, high at the
   ceiling — boost pulls a band toward you) · volume is one slider on the
   right wall (closer is louder) · width lives on the back edge: corners are
   100%, the middle is mono, past the walls is 200%. lows wear ink, mids the
   accent, highs the muted gray — the handles wear the register they own.
   web audio + one canvas, no deps. */
(() => {
  const cv = document.getElementById('room');
  const ctx = cv.getContext('2d');
  const au = document.getElementById('au');
  const pickEl = document.getElementById('pick');
  const timeEl = document.getElementById('time');
  const lineEl = document.getElementById('line');
  const fillEl = document.getElementById('fill');
  const hintEl = document.getElementById('hint');
  const libEl = document.getElementById('lib');
  const fileEl = document.getElementById('file');

  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue('--ink').trim();
  const MUTED = css.getPropertyValue('--muted').trim();
  const ACCENT = css.getPropertyValue('--accent').trim();

  /* ---- the room: bilinear perspective between a near and a far rectangle ---- */
  let W = 0, H = 0, nr, fr;
  const size = () => {
    const dpr = window.devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nr = { hw: Math.min(W * 0.42, 430), bottom: H * 0.96, h: H * 0.84 };
    fr = { hw: nr.hw * 0.30, bottom: H * 0.585, h: nr.h * 0.30 };
  };
  const P = (rx, ry, t) => {
    const hw = nr.hw + (fr.hw - nr.hw) * t;
    return {
      x: W / 2 + rx * hw,
      y: (nr.bottom + (fr.bottom - nr.bottom) * t) - ry * (nr.h + (fr.h - nr.h) * t),
      s: hw / nr.hw
    };
  };

  /* ---- frequency: 30hz at the floor, 18khz at the ceiling, log ---- */
  const FMIN = 30, FMAX = 18000, FLOG = Math.log(FMAX / FMIN);
  const fy = f => Math.log(f / FMIN) / FLOG;

  /* ---- plugins: model first, audio nodes when the graph exists ---- */
  const EQDEF = [
    { name: 'low', type: 'lowshelf', f: 160 },
    { name: 'mid', type: 'peaking', f: 1000, q: 0.8 },
    { name: 'high', type: 'highshelf', f: 5000 }
  ];
  const eqRy = EQDEF.map(d => fy(d.f));
  const eqGain = [0, 0, 0];              /* db, ±12 */
  let vol = 1;                           /* 0..1, audio taper */
  let width = 1;                         /* 0 mono · 1 at the corners · 2 past the walls */

  const eqT = i => 0.5 - (eqGain[i] / 12) * 0.45;    /* boost → near */
  const VOLRY = eqRy[1];                             /* the fader rides the middle line */
  const volT = () => 0.95 - vol * 0.9;               /* loud → near */

  /* registers: where the crossovers sit, and the color each side of them wears */
  const XLOW = fy(250), XHIGH = fy(4000);
  const regColor = ry => ry < XLOW ? INK : ry < XHIGH ? ACCENT : MUTED;
  const EQCOL = [INK, ACCENT, MUTED];

  /* ---- audio graph — built on the first gesture ---- */
  let ac = null, EQ = null, sideW = null, master = null, anL = null, anR = null;
  let bufL, bufR, bands = null, order = null;
  const graph = () => {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaElementSource(au);
    const g = v => { const n = ac.createGain(); n.gain.value = v; return n; };

    const pre = g(1);                    /* mono in → both ears */
    pre.channelCount = 2; pre.channelCountMode = 'explicit';

    EQ = EQDEF.map((d, i) => {
      const b = ac.createBiquadFilter();
      b.type = d.type; b.frequency.value = d.f;
      if (d.q) b.Q.value = d.q;
      b.gain.value = eqGain[i];
      return b;
    });

    /* width — mid/side: side gain is the control */
    const sp = ac.createChannelSplitter(2);
    const mid = g(1), side = g(1);
    const l2m = g(0.5), r2m = g(0.5), l2s = g(0.5), r2s = g(-0.5);
    sp.connect(l2m, 0); sp.connect(r2m, 1); sp.connect(l2s, 0); sp.connect(r2s, 1);
    l2m.connect(mid); r2m.connect(mid); l2s.connect(side); r2s.connect(side);
    sideW = g(width);
    const inv = g(-1);
    const mg = ac.createChannelMerger(2);
    mid.connect(mg, 0, 0); mid.connect(mg, 0, 1);
    side.connect(sideW); sideW.connect(mg, 0, 0);
    sideW.connect(inv); inv.connect(mg, 0, 1);

    master = g(vol * vol);
    src.connect(pre);
    pre.connect(EQ[0]); EQ[0].connect(EQ[1]); EQ[1].connect(EQ[2]);
    EQ[2].connect(sp);
    mg.connect(master); master.connect(ac.destination);

    /* analysis after everything — the room shows what leaves the chain */
    const asp = ac.createChannelSplitter(2);
    master.connect(asp);
    anL = ac.createAnalyser(); anR = ac.createAnalyser();
    anL.fftSize = anR.fftSize = 4096;
    const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.92 : 0.8;
    anL.smoothingTimeConstant = anR.smoothingTimeConstant = smooth;
    asp.connect(anL, 0); asp.connect(anR, 1);
    bufL = new Uint8Array(anL.frequencyBinCount);
    bufR = new Uint8Array(anR.frequencyBinCount);

    /* log-spaced bands over the fft bins */
    const NB = 40, binHz = ac.sampleRate / anL.fftSize;
    bands = [];
    for (let i = 0; i < NB; i++) {
      const f0 = FMIN * Math.pow(FMAX / FMIN, i / NB);
      const f1 = FMIN * Math.pow(FMAX / FMIN, (i + 1) / NB);
      const b0 = Math.max(1, Math.round(f0 / binHz));
      const b1 = Math.max(b0 + 1, Math.round(f1 / binHz));
      bands.push({ b0, b1, ry: (i + 0.5) / NB, x: 0, loud: 0 });
    }
    order = bands.map((_, i) => i);
  };

  const setParam = (p, v) => p.setTargetAtTime(v, ac.currentTime, 0.01);

  /* ---- drawing ---- */
  let drag = null;

  /* the cube: octave lines run level around the walls — equal spacing is
     equal musical distance. verticals and floor lines quarter the depth. */
  const OCTAVES = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000].map(fy);
  const QUARTERS = [0.25, 0.5, 0.75];
  const seg = (a, b) => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); };
  const wire = () => {
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1;
    /* grid */
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    for (const ry of OCTAVES) {
      seg(P(-1, ry, 0), P(-1, ry, 1));   /* left wall  */
      seg(P(-1, ry, 1), P(1, ry, 1));    /* back wall  */
      seg(P(1, ry, 1), P(1, ry, 0));     /* right wall */
    }
    for (const t of QUARTERS) {
      seg(P(-1, 0, t), P(-1, 1, t));     /* wall verticals */
      seg(P(1, 0, t), P(1, 1, t));
      seg(P(-1, 0, t), P(1, 0, t));      /* floor rungs */
    }
    for (const rx of [-0.5, 0, 0.5]) {
      seg(P(rx, 0, 0), P(rx, 0, 1));     /* floor depth lines */
      seg(P(rx, 0, 1), P(rx, 1, 1));     /* back wall verticals */
    }
    ctx.stroke();
    /* frame + the tracks the handles ride */
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    for (const t of [0, 1]) {
      const a = P(-1, 0, t), b = P(1, 0, t), c = P(1, 1, t), d = P(-1, 1, t);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y); ctx.lineTo(a.x, a.y);
    }
    for (const [rx, ry] of [[-1, 0], [1, 0], [1, 1], [-1, 1]])
      seg(P(rx, ry, 0), P(rx, ry, 1));
    seg(P(-2, 0, 1), P(2, 0, 1));        /* width track, past both corners */
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = INK;               /* the right wall rivals the left: three ink
                                            lines, the fader rides the middle one */
    ctx.beginPath();
    for (const ry of eqRy) seg(P(1, ry, 0), P(1, ry, 1));
    ctx.stroke();
    for (let i = 0; i < 3; i++) {        /* eq tracks wear their register */
      ctx.strokeStyle = EQCOL[i];
      ctx.beginPath();
      seg(P(-1, eqRy[i], 0), P(-1, eqRy[i], 1));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const handles = () => {
    const hs = eqRy.map((ry, i) => ({ kind: 'eq', i, ...P(-1, ry, eqT(i)) }));
    hs.push({ kind: 'vol', ...P(1, VOLRY, volT()) });
    hs.push({ kind: 'w', side: 1, ...P(width, 0, 1) });
    hs.push({ kind: 'w', side: -1, ...P(-width, 0, 1) });
    return hs;
  };

  const drawHandles = () => {
    ctx.font = '11px ui-monospace, SF Mono, Menlo, monospace';
    ctx.textAlign = 'left';
    for (const h of handles()) {
      const active = drag && drag.kind === h.kind && drag.i === h.i && drag.side === h.side;
      if (h.kind === 'eq') {
        ctx.fillStyle = EQCOL[h.i];
        ctx.globalAlpha = active ? 1 : 0.85;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 5.5 * h.s + 1.5, 0, 7);
        ctx.fill();
      } else if (h.kind === 'vol') {
        const r = 4.5 * h.s + 1.5;
        ctx.fillStyle = INK;
        ctx.globalAlpha = active ? 1 : 0.85;
        ctx.fillRect(h.x - r, h.y - r, r * 2, r * 2);
      } else {
        ctx.strokeStyle = INK;
        ctx.globalAlpha = active ? 1 : 0.6;
        ctx.lineWidth = 1.5;
        const e = 7, o = 5 * h.side;
        ctx.beginPath();
        ctx.moveTo(h.x + o, h.y - e); ctx.lineTo(h.x, h.y - e * 0.2);
        ctx.lineTo(h.x, h.y + e * 0.2); ctx.lineTo(h.x + o, h.y + e);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (drag) {
      let text = '';
      if (drag.kind === 'eq') {
        const gdb = eqGain[drag.i];
        text = `${EQDEF[drag.i].name} ${gdb >= 0 ? '+' : ''}${gdb.toFixed(1)}`;
      } else if (drag.kind === 'vol') text = `vol ${Math.round(vol * 100)}`;
      else text = `width ${Math.round(width * 100)}%`;
      const h = handles().find(h => h.kind === drag.kind && h.i === drag.i && h.side === drag.side);
      ctx.fillStyle = INK;
      ctx.fillText(text, Math.min(h.x + 14, W - 84), h.y - 12);
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    wire();

    if (bands && anL) {
      anL.getByteFrequencyData(bufL);
      anR.getByteFrequencyData(bufR);
      let peak = -1, peakLoud = 0;
      for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        let vL = 0, vR = 0;
        for (let j = b.b0; j < b.b1; j++) {
          if (bufL[j] > vL) vL = bufL[j];
          if (bufR[j] > vR) vR = bufR[j];
        }
        vL /= 255; vR /= 255;
        b.loud = (vL + vR) / 2;
        const xt = Math.max(-1, Math.min(1, (vR - vL) * 3 / (vL + vR + 0.001)));
        b.x += (xt - b.x) * 0.25;
        if (b.loud > peakLoud) { peakLoud = b.loud; peak = i; }
      }
      order.sort((a, b) => bands[a].loud - bands[b].loud);   /* far first, loud on top */
      for (const i of order) {
        const b = bands[i];
        if (b.loud < 0.05) continue;
        const t = 1 - b.loud * 0.96;
        const p = P(b.x * 0.92, b.ry, t);
        const near = 1 - t;              /* proximity carries the volume: */
        if (i === peak) {                /* the one the ear locks onto */
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = ACCENT;
        } else {
          ctx.globalAlpha = 0.06 + 0.94 * near * near;   /* haze far, solid near */
          ctx.fillStyle = regColor(b.ry);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1.5 + 8.5 * near) * p.s, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = '12px ui-monospace, SF Mono, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('drop a track into the room', W / 2, H * 0.55);
      ctx.textAlign = 'left';
    }

    drawHandles();
  };

  let raf = 0;
  const run = () => {
    draw();
    if (!au.paused) raf = requestAnimationFrame(run);
  };

  /* ---- pointer: press plays, handles drag ---- */
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const projT = (a, b, x, y) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
  };
  const hintDone = () => { hintEl.hidden = true; localStorage.setItem('rz.space.hint', '1'); };
  if (localStorage.getItem('rz.space.hint')) hintEl.hidden = true;

  let down = false, moved = false;
  cv.addEventListener('pointerdown', e => {
    const { x, y } = pos(e);
    down = true; moved = false;
    let best = null, bd = 28;
    for (const h of handles()) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = h; }
    }
    drag = best && { kind: best.kind, i: best.i, side: best.side };
    if (drag) { cv.setPointerCapture(e.pointerId); draw(); }
  });
  cv.addEventListener('pointermove', e => {
    if (!down) return;
    moved = true;
    if (!drag) return;
    const { x, y } = pos(e);
    if (drag.kind === 'eq') {
      const ry = eqRy[drag.i];
      const t = projT(P(-1, ry, 0), P(-1, ry, 1), x, y);
      eqGain[drag.i] = Math.max(-12, Math.min(12, (0.5 - t) / 0.45 * 12));
      if (EQ) setParam(EQ[drag.i].gain, eqGain[drag.i]);
    } else if (drag.kind === 'vol') {
      const t = projT(P(1, VOLRY, 0), P(1, VOLRY, 1), x, y);
      vol = Math.max(0, Math.min(1, (0.95 - t) / 0.9));
      if (master) setParam(master.gain, vol * vol);
    } else {
      width = Math.max(0, Math.min(2, Math.abs((x - W / 2) / fr.hw)));
      if (sideW) setParam(sideW.gain, width);
    }
    if (au.paused || !bands) draw();
  });
  const release = () => {
    if (drag) { drag = null; hintDone(); draw(); }
    down = false;
  };
  cv.addEventListener('pointerup', e => {
    const wasDrag = !!drag;
    release();
    if (!wasDrag && !moved) roomPress();
  });
  cv.addEventListener('pointercancel', release);
  cv.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); roomPress(); }
  });

  const roomPress = () => {
    if (!au.src) { fileEl.click(); return; }
    if (au.paused) { ac && ac.resume(); au.play(); }
    else { au.pause(); }
  };

  /* ---- player ---- */
  const fmt = s => isFinite(s)
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '';
  const ppEl = document.getElementById('pp');
  ppEl.addEventListener('click', roomPress);
  const pp = playing => {
    ppEl.textContent = playing ? '‖' : '▸';
    ppEl.setAttribute('aria-label', playing ? 'pause' : 'play');
  };
  au.addEventListener('play', () => { pp(true); cancelAnimationFrame(raf); run(); });
  au.addEventListener('pause', () => { pp(false); cancelAnimationFrame(raf); draw(); });
  au.addEventListener('ended', () => { pp(false); cancelAnimationFrame(raf); draw(); });
  au.addEventListener('timeupdate', () => {
    fillEl.style.width = au.duration ? `${(au.currentTime / au.duration) * 100}%` : '0%';
    timeEl.textContent = `${fmt(au.currentTime)} / ${fmt(au.duration)}`;
  });
  lineEl.addEventListener('pointerdown', e => {
    if (!au.duration) return;
    const r = lineEl.getBoundingClientRect();
    au.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * au.duration;
  });

  const load = (url, title) => {
    graph();
    ac.resume();
    au.src = url;
    pickEl.textContent = title;
    au.play();
  };
  pickEl.addEventListener('click', () => fileEl.click());
  fileEl.addEventListener('change', () => {
    const f = fileEl.files[0];
    if (f) load(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, '').toLowerCase());
    fileEl.value = '';
  });
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio')) load(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, '').toLowerCase());
  });

  /* anything already on /sound is in the library */
  fetch('/data/mixes.json').then(r => r.json()).then(items => {
    if (!Array.isArray(items) || !items.length) return;
    libEl.hidden = false;
    libEl.innerHTML = items.map((m, i) => {
      const v = m.versions[m.versions.length - 1];
      return `<li><button data-i="${i}" class="mark">${m.title} · v${v.v}</button></li>`;
    }).join('');
    libEl.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const m = items[+b.dataset.i];
      load(m.versions[m.versions.length - 1].url, m.title);
    });
  }).catch(() => {});

  size();
  addEventListener('resize', () => { size(); draw(); });
  draw();
})();
