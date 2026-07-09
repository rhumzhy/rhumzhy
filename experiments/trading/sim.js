/* trading — pure price action. seeded synthetic market, the chart is the control.
   drills: free · swing · scalp · compound · exit. each drill is a round; a round
   ends in a one-line verdict; press to redeal. */
(() => {
  /* ---- seeded market ---- */
  const mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const newSeed = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const param = new URLSearchParams(location.search).get('s');
  const firstSeed = /^[0-9a-f]{1,8}$/i.test(param || '') ? param.toLowerCase() : newSeed();

  /* hidden regimes — the market changes character without telling you */
  const REGIMES = [
    { mu: 0.00045, vol: 0.006 },   /* drift up */
    { mu: -0.00045, vol: 0.006 },  /* drift down */
    { mu: 0, vol: 0.0035 },        /* chop */
    { mu: 0, vol: 0.014 }          /* violence */
  ];

  const TICKS_PER_CANDLE = 6;
  let rand, regime, price, seedHex;
  let candles, forming, tcount;

  const normal = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const tick = () => {
    if (rand() < 0.008) regime = Math.floor(rand() * REGIMES.length);
    const { mu, vol } = REGIMES[regime];
    price *= Math.exp(mu - vol * vol / 2 + vol * normal());
    return price;
  };
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

  const seedEl = document.getElementById('seed');
  const setMarket = s => {
    seedHex = s;
    rand = mulberry32(parseInt(s, 16));
    regime = Math.floor(rand() * REGIMES.length);
    price = 1000; candles = []; forming = null; tcount = 0;
    levels.length = 0;                            /* marks belong to their market */
    for (let i = 0; i < 60 * TICKS_PER_CANDLE; i++) step();   /* the market predates you */
    seedEl.textContent = 'seed ' + s;
    seedEl.href = '?s=' + s;
  };

  /* ---- account: a position is a stack of lots ---- */
  const START = 10000;
  let equity, lots, dir, peak, maxdd, trades, adds, addsInProfit, autoOpened, exitRealized;
  const resetAccount = () => {
    equity = START; lots = []; dir = 0; peak = START; maxdd = 0;
    trades = 0; adds = 0; addsInProfit = 0; autoOpened = false; exitRealized = null;
  };

  const posQty = () => lots.reduce((s, l) => s + l.qty, 0);
  const openPnl = () => lots.reduce((s, l) => s + dir * l.qty * (price - l.entry), 0);
  const avgEntry = () => lots.length ? lots.reduce((s, l) => s + l.entry * l.qty, 0) / posQty() : 0;
  const net = () => equity + openPnl();
  const openLot = (d, frac) => { if (!lots.length) dir = d; lots.push({ entry: price, qty: equity * frac / price }); };
  const closeLot = () => {                       /* lifo — take off the top */
    const l = lots.pop();
    equity += dir * l.qty * (price - l.entry);
    trades++;
    if (!lots.length) dir = 0;
  };
  const closeAll = () => { while (lots.length) closeLot(); };

  /* ---- drills ---- */
  const MODES = ['free', 'swing', 'scalp', 'compound', 'exit'];
  const ROUND = {
    swing: { len: 200 },
    scalp: { ms: 90000, speed: 4 },
    compound: { len: 150 },
    exit: { len: 120, entryAt: 10 }
  };
  let mode = 'free';
  let roundOn = false, roundStart = 0, roundMs = 0;

  const roundCandles = () => candles.length - roundStart;
  const closes = () => candles.slice(roundStart).map(c => c.c);
  const pctf = x => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}%`;

  const verdictEl = document.getElementById('verdict');
  const startRound = () => {
    setMarket(newSeed());
    resetAccount();
    verdictEl.innerHTML = '';
    roundOn = mode !== 'free';
    roundStart = candles.length;
    roundMs = 0;
    if (mode === 'scalp') setSpeed(ROUND.scalp.speed);
    setPaused(false);
    stats(); draw();
  };

  const endRound = () => {
    if (mode === 'exit' && lots.length) exitRealized = openPnl() / START;
    closeAll();
    roundOn = false;
    setPaused(true);
    const cs = closes();
    const ret = equity / START - 1;
    let text = '', good = false;

    if (mode === 'swing') {
      let minC = Infinity, maxC = -Infinity, bestL = 0, bestS = 0;
      for (const c of cs) {
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        bestL = Math.max(bestL, c / minC - 1);
        bestS = Math.max(bestS, (maxC - c) / maxC);
      }
      const bench = Math.max(bestL, bestS);
      const score = bench > 0 ? Math.max(0, Math.round(ret / bench * 100)) : 0;
      good = score >= 80;
      text = `${pctf(ret)} · best ride ${pctf(bench)} · ${score}`;
    } else if (mode === 'scalp') {
      good = ret > 0;
      text = `${pctf(ret)} · ${trades} trade${trades === 1 ? '' : 's'}`;
    } else if (mode === 'compound') {
      good = ret > 0 && adds > 0 && addsInProfit === adds;
      text = `${pctf(ret)} · adds in profit ${addsInProfit}/${adds}`;
    } else if (mode === 'exit') {
      const e = lots.length === 0 && exitRealized !== null ? exitRealized : 0;
      const entryIdx = ROUND.exit.entryAt;
      const after = cs.slice(entryIdx);
      const entryP = after.length ? after[0] : price;
      const best = exitDir > 0
        ? Math.max(...after) / entryP - 1
        : 1 - Math.min(...after) / entryP;
      const score = best > 0 ? Math.min(100, Math.max(0, Math.round(e / best * 100))) : 0;
      good = score >= 80;
      text = `exit ${pctf(e)} · best ${pctf(Math.max(best, 0))} · ${score}`;
    }
    verdictEl.innerHTML = `<span${good ? ' class="good"' : ''}>${text}</span> · press to redeal`;
    stats(); draw();
  };

  let exitDir = 1;   /* direction of the auto-entry in exit mode */

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
  let p2y = null, vLo = 0, vHi = 1;
  const y2p = y => vLo + ((H - y) / H) * (vHi - vLo);

  /* marked levels — hold to place, hold on one to remove */
  const levels = [];

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const view = candles.slice(-VISIBLE).concat(forming ? [forming] : []);
    if (!view.length) return;
    let lo = Infinity, hi = -Infinity;
    for (const c of view) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
    if (lots.length) { lo = Math.min(lo, avgEntry()); hi = Math.max(hi, avgEntry()); }
    const padP = (hi - lo) * 0.08 || 1;
    lo -= padP; hi += padP;

    const cw = (W - GUTTER) / VISIBLE;
    vLo = lo; vHi = hi;
    p2y = p => H - ((p - lo) / (hi - lo)) * H;

    /* levels sit under the tape */
    ctx.font = '10px ui-monospace, SF Mono, Menlo, monospace';
    ctx.textAlign = 'left';
    for (const lv of levels) {
      if (lv < lo || lv > hi) continue;
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, p2y(lv)); ctx.lineTo(W - GUTTER, p2y(lv));
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText(lv.toFixed(1), W - GUTTER + 8, p2y(lv) - 3);
      ctx.globalAlpha = 1;
    }

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

    /* entry — the one color: where you stand. thickness = size on. */
    if (lots.length) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = lots.length;
      ctx.beginPath();
      ctx.moveTo(0, p2y(avgEntry())); ctx.lineTo(W - GUTTER, p2y(avgEntry()));
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
    let pos = '';
    if (lots.length) {
      const u = mode === 'compound' ? ` ${lots.length}/3` : '';
      pos = ` · ${dir > 0 ? 'long' : 'short'}${u} ${pctf(openPnl() / START)}`;
    }
    statsEl.textContent =
      `${Math.round(cur).toLocaleString('en-US')} · ${r >= 0 ? '+' : ''}${r.toFixed(2)}% · dd ${(maxdd * 100).toFixed(1)}%${pos}`;
  };

  /* ---- clock ---- */
  let speed = 1, paused = false, timer = null, lastT = 0;
  const BASE_MS = 420;   /* a candle ~2.5s at 1x — higher-timeframe patience, not arcade */
  const loop = () => {
    const now = performance.now();
    if (!paused) {
      if (lastT) roundMs += now - lastT;
      step();
      if (roundOn) {
        const cfg = ROUND[mode];
        if (mode === 'exit' && !autoOpened && roundCandles() >= cfg.entryAt) {
          exitDir = rand() < 0.5 ? 1 : -1;
          openLot(exitDir, 1);
          autoOpened = true;
        }
        const done = cfg.ms ? roundMs >= cfg.ms : roundCandles() >= cfg.len;
        if (done) { endRound(); lastT = now; timer = setTimeout(loop, BASE_MS / speed); return; }
      }
      stats(); draw();
    }
    lastT = now;
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

  const act = d => {                             /* d: +1 above, -1 below */
    if (mode !== 'free' && !roundOn) { startRound(); return; }
    if (mode === 'compound') {
      if (!lots.length) openLot(d, 1 / 3);
      else if (d === dir) {
        if (lots.length < 3) {
          adds++;
          if (openPnl() > 0) addsInProfit++;
          openLot(dir, 1 / 3);
        }
      } else closeLot();                         /* partial take, one third off */
    } else if (mode === 'exit') {
      if (lots.length) { exitRealized = openPnl() / START; closeAll(); }
    } else {
      if (lots.length) closeAll();
      else { openLot(d, 1); if (mode === 'free') hintDone(); }
    }
    stats(); draw();
  };

  const toggleLevel = y => {
    const near = levels.findIndex(lv => p2y && Math.abs(p2y(lv) - y) < 10);
    if (near >= 0) levels.splice(near, 1);
    else levels.push(y2p(y));
    draw();
  };

  /* quick press trades · press-and-hold marks a level */
  let holdT = null, held = false, downY = 0;
  cv.addEventListener('pointerdown', e => {
    downY = e.offsetY; held = false;
    holdT = setTimeout(() => { held = true; toggleLevel(downY); }, 350);
  });
  cv.addEventListener('pointerup', e => {
    clearTimeout(holdT);
    if (held || !p2y) return;
    act(e.offsetY < p2y(price) ? 1 : -1);
  });
  cv.addEventListener('pointerleave', () => clearTimeout(holdT));
  cv.addEventListener('contextmenu', e => e.preventDefault());

  addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); setPaused(!paused); return; }
    if (e.key >= '1' && e.key <= '3') { setSpeed([1, 2, 4][e.key - 1]); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); act(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); act(-1); }
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (mode !== 'free' && !roundOn) { startRound(); return; }
      if (lots.length) {
        if (mode === 'exit') exitRealized = openPnl() / START;
        closeAll(); stats(); draw();
      }
    }
  });

  pauseEl.addEventListener('click', () => setPaused(!paused));
  speedEl.addEventListener('click', () => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1));

  /* ---- mode row ---- */
  const modesEl = document.getElementById('modes');
  const renderModes = () => {
    modesEl.innerHTML = MODES.map(m =>
      `<button class="mode${m === mode ? ' on' : ''}" data-m="${m}">${m}</button>`
    ).join('');
  };
  modesEl.addEventListener('click', e => {
    const m = e.target.dataset && e.target.dataset.m;
    if (!m || m === mode) return;
    mode = m;
    hintEl.hidden = mode !== 'free' || !!localStorage.getItem('rz.trading.hint');
    renderModes();
    startRound();
  });

  /* ---- go ---- */
  renderModes();
  setMarket(firstSeed);
  resetAccount();
  stats(); draw(); loop();
})();
