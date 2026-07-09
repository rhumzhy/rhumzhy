/* trading — pure price action. seeded synthetic market, the chart is the control. */
(() => {
  /* ---- seeded market ---- */
  const mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  const param = new URLSearchParams(location.search).get('s');
  const seedHex = /^[0-9a-f]{1,8}$/i.test(param || '') ? param.toLowerCase()
    : Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const rand = mulberry32(parseInt(seedHex, 16));
  const normal = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  /* hidden regimes — the market changes character without telling you */
  const REGIMES = [
    { mu: 0.00045, vol: 0.006 },   /* drift up */
    { mu: -0.00045, vol: 0.006 },  /* drift down */
    { mu: 0, vol: 0.0035 },        /* chop */
    { mu: 0, vol: 0.014 }          /* violence */
  ];
  let regime = Math.floor(rand() * REGIMES.length);
  let price = 1000;
  const tick = () => {
    if (rand() < 0.008) regime = Math.floor(rand() * REGIMES.length);
    const { mu, vol } = REGIMES[regime];
    price *= Math.exp(mu - vol * vol / 2 + vol * normal());
    return price;
  };

  /* ---- candles ---- */
  const TICKS_PER_CANDLE = 6;
  const candles = [];
  let forming = null, tcount = 0;
  const step = () => {
    const p = tick();
    if (!forming) forming = { o: p, h: p, l: p, c: p };
    forming.h = Math.max(forming.h, p);
    forming.l = Math.min(forming.l, p);
    forming.c = p;
    if (++tcount >= TICKS_PER_CANDLE) {
      candles.push(forming);
      forming = null; tcount = 0;
    }
  };
  for (let i = 0; i < 60 * TICKS_PER_CANDLE; i++) step();   /* the market predates you */

  /* ---- account ---- */
  const START = 10000;
  let equity = START, side = 0, entry = 0, qty = 0;
  let peak = START, maxdd = 0;

  const openPnl = () => side ? side * qty * (price - entry) : 0;
  const net = () => equity + openPnl();

  const open = dir => { side = dir; entry = price; qty = equity / price; hintDone(); };
  const close = () => { equity += openPnl(); side = 0; };

  /* ---- canvas ---- */
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue('--ink').trim();
  const MUTED = css.getPropertyValue('--muted').trim();
  const ACCENT = css.getPropertyValue('--accent').trim();
  const PAPER = css.getPropertyValue('--paper').trim();
  const GUTTER = 56;

  let W = 0, H = 0;
  const size = () => {
    const dpr = window.devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size(); addEventListener('resize', () => { size(); draw(); });

  const VISIBLE = 80;
  let y2p = null, p2y = null;   /* set each draw */

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const view = candles.slice(-VISIBLE).concat(forming ? [forming] : []);
    if (!view.length) return;
    let lo = Infinity, hi = -Infinity;
    for (const c of view) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
    if (side) { lo = Math.min(lo, entry); hi = Math.max(hi, entry); }
    const padP = (hi - lo) * 0.08 || 1;
    lo -= padP; hi += padP;

    const cw = (W - GUTTER) / VISIBLE;
    p2y = p => H - ((p - lo) / (hi - lo)) * H;
    y2p = y => lo + ((H - y) / H) * (hi - lo);

    view.forEach((c, i) => {
      const x = (i + (VISIBLE - view.length)) * cw + cw / 2;
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, p2y(c.h)); ctx.lineTo(x, p2y(c.l));
      ctx.stroke();
      const bw = Math.max(cw * 0.55, 2);
      const yo = p2y(c.o), yc = p2y(c.c);
      const top = Math.min(yo, yc), hgt = Math.max(Math.abs(yc - yo), 1);
      if (c.c >= c.o) {            /* up — hollow */
        ctx.fillStyle = PAPER; ctx.strokeStyle = INK;
        ctx.fillRect(x - bw / 2, top, bw, hgt);
        ctx.strokeRect(x - bw / 2, top, bw, hgt);
      } else {                     /* down — solid */
        ctx.fillStyle = INK;
        ctx.fillRect(x - bw / 2, top, bw, hgt);
      }
    });

    /* entry — the one color: where you stand */
    if (side) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, p2y(entry)); ctx.lineTo(W - GUTTER, p2y(entry));
      ctx.stroke();
    }

    /* price scale — three quiet marks + the price itself */
    ctx.font = '10px ui-monospace, SF Mono, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    for (const p of [lo + padP, (lo + hi) / 2, hi - padP])
      ctx.fillText(p.toFixed(1), W - GUTTER + 8, p2y(p) + 3);
    ctx.fillStyle = INK;
    ctx.fillText(price.toFixed(1), W - GUTTER + 8, p2y(price) + 3);
  };

  /* ---- stats ---- */
  const statsEl = document.getElementById('stats');
  const stats = () => {
    const cur = net();
    peak = Math.max(peak, cur);
    maxdd = Math.max(maxdd, (peak - cur) / peak);
    const r = (cur / START - 1) * 100;
    const pos = side ? ` · ${side > 0 ? 'long' : 'short'} ${(openPnl() / equity * 100) >= 0 ? '+' : ''}${(openPnl() / equity * 100).toFixed(2)}` : '';
    statsEl.textContent =
      `${Math.round(cur).toLocaleString('en-US')} · ${r >= 0 ? '+' : ''}${r.toFixed(2)}% · dd ${(maxdd * 100).toFixed(1)}%${pos}`;
  };

  /* ---- clock ---- */
  let speed = 1, paused = false, timer = null;
  const BASE_MS = 110;
  const loop = () => {
    if (!paused) { step(); stats(); draw(); }
    timer = setTimeout(loop, BASE_MS / speed);
  };

  const speedEl = document.getElementById('speed');
  const pauseEl = document.getElementById('pause');
  const setSpeed = s => { speed = s; speedEl.textContent = s + 'x'; };
  const setPaused = p => { paused = p; pauseEl.textContent = paused ? '▸' : '‖'; };

  /* ---- the chart is the control ---- */
  const hintEl = document.getElementById('hint');
  const hintDone = () => { hintEl.hidden = true; localStorage.setItem('rz.trading.hint', '1'); };
  if (localStorage.getItem('rz.trading.hint')) hintEl.hidden = true;

  const act = y => {
    if (side) { close(); }
    else if (p2y) { open(y < p2y(price) ? 1 : -1); }
    stats(); draw();
  };
  cv.addEventListener('pointerdown', e => act(e.offsetY));

  addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); setPaused(!paused); return; }
    if (e.key >= '1' && e.key <= '3') { setSpeed([1, 2, 4][e.key - 1]); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (side) close();
      else if (e.key === 'ArrowUp') open(1);
      else if (e.key === 'ArrowDown') open(-1);
      stats(); draw();
    }
  });

  pauseEl.addEventListener('click', () => setPaused(!paused));
  speedEl.addEventListener('click', () => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1));
  document.getElementById('seed').textContent = 'seed ' + seedHex;
  document.getElementById('seed').href = '?s=' + seedHex;

  stats(); draw(); loop();
})();
