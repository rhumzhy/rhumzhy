/* trading — pure price action. seeded synthetic market, the chart is the control.
   one market, six views: 1M · 1w · 1d · 4h · 1h · 5m — top-down, left to right.
   the market generates at 5m under the hood; higher timeframes are true
   aggregations, and ~3 years of pre-history (generated daily) fills the HTFs.
   time moves at the pace of your attention: one candle of the watched
   timeframe forms every ~2.5s at 1x (capped at daily rate for 1w/1M).
   drills: free · swing · scalp · compound · exit. rounds end in a verdict. */
(() => {
  /* ---- seeded prng ---- */
  const mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const newSeed = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const param = new URLSearchParams(location.search).get('s');
  const firstSeed = /^[0-9a-f]{1,8}$/i.test(param || '') ? param.toLowerCase() : newSeed();

  /* hidden regimes — per-tick params, calibrated so vol scales honestly:
     ~0.15% per 5m candle → ~2.5% daily → ~14% monthly */
  const REGIMES = [
    { mu: 0.00001, vol: 0.0006 },    /* drift up */
    { mu: -0.00001, vol: 0.0006 },   /* drift down */
    { mu: 0, vol: 0.00035 },         /* chop */
    { mu: 0, vol: 0.0014 }           /* violence */
  ];
  const SWITCH = 0.0003;             /* regime flips last ~2 days */

  const TICKS_PER_CANDLE = 6;        /* ticks per 5m base candle */
  const DAY = 288;                   /* base candles per day */

  let rand, regime, price, seedHex;
  let hist, base, forming, tcount, trimmed;   /* hist: daily pre-history · base: live 5m */

  const normal = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const tick = () => {
    if (rand() < SWITCH) regime = Math.floor(rand() * REGIMES.length);
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
      base.push(forming);
      forming = null; tcount = 0;
    }
  };

  /* a pre-history day in 12 strokes — same process, coarser brush */
  const genDay = () => {
    const SUB = 144;                 /* ticks folded into one stroke */
    const o = price; let h = price, l = price;
    for (let i = 0; i < 12; i++) {
      if (rand() < SWITCH * SUB) regime = Math.floor(rand() * REGIMES.length);
      const { mu, vol } = REGIMES[regime];
      const m = mu * SUB, v = vol * Math.sqrt(SUB);
      price *= Math.exp(m - v * v / 2 + v * normal());
      h = Math.max(h, price); l = Math.min(l, price);
    }
    return { o, h, l, c: price };
  };

  const seedEl = document.getElementById('seed');
  const setMarket = s => {
    seedHex = s;
    rand = mulberry32(parseInt(s, 16));
    regime = Math.floor(rand() * REGIMES.length);
    price = 1000;
    hist = []; base = []; forming = null; tcount = 0; trimmed = 0;
    levels.length = 0;                            /* marks belong to their market */
    for (let i = 0; i < 1080; i++) hist.push(genDay());   /* ~3 years for the HTFs */
    for (let i = 0; i < 14 * DAY * TICKS_PER_CANDLE; i++) step();   /* two weeks of live tape */
    seedEl.textContent = 'seed ' + s;
    seedEl.href = '?s=' + s;
  };

  /* keep memory bounded: fold the oldest live days into pre-history (never mid-round) */
  const trim = () => {
    while (base.length > 80000) {
      const day = base.splice(0, DAY);
      trimmed += DAY;
      hist.push({
        o: day[0].o,
        h: Math.max(...day.map(c => c.h)),
        l: Math.min(...day.map(c => c.l)),
        c: day[day.length - 1].c
      });
    }
  };

  /* ---- timeframes: one market, six views ---- */
  const TFS = {
    '1M': { kd: 30 }, '1w': { kd: 7 }, '1d': { kd: 1 },
    '4h': { k: 48 }, '1h': { k: 12 }, '5m': { k: 1 }
  };
  const TF_ORDER = ['1M', '1w', '1d', '4h', '1h', '5m'];
  let tf = '1h';
  const perDisplayed = t => TFS[t].k || TFS[t].kd * DAY;   /* base candles per displayed candle */
  const ticksPerStep = () => Math.min(perDisplayed(tf), DAY);

  const bucket = (arr, k) => {
    const out = [];
    for (let i = 0; i < arr.length; i += k) {
      let h = -Infinity, l = Infinity;
      const end = Math.min(i + k, arr.length);
      for (let j = i; j < end; j++) {
        if (arr[j].h > h) h = arr[j].h;
        if (arr[j].l < l) l = arr[j].l;
      }
      out.push({ o: arr[i].o, h, l, c: arr[end - 1].c });
    }
    return out;
  };

  const VISIBLE = 80;
  const viewCandles = () => {
    const live = forming ? base.concat([forming]) : base;
    if (TFS[tf].k) {
      const k = TFS[tf].k;
      let start = Math.max(0, live.length - VISIBLE * k);
      start -= start % k;                        /* stay on the bucket grid */
      return bucket(live.slice(start), k).slice(-VISIBLE);
    }
    const daily = hist.concat(bucket(live, DAY));
    return bucket(daily, TFS[tf].kd).slice(-VISIBLE);
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
  let roundOn = false, roundMs = 0;
  let roundStartAbs = 0, roundLenBase = 0, roundEntryBase = 0;

  const absCount = () => trimmed + base.length;
  const roundBase = () => absCount() - roundStartAbs;
  const closes = () => base.slice(roundStartAbs - trimmed).map(c => c.c);
  const pctf = x => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}%`;

  const verdictEl = document.getElementById('verdict');
  const startRound = () => {
    setMarket(newSeed());
    resetAccount();
    verdictEl.innerHTML = '';
    roundOn = mode !== 'free';
    roundMs = 0;
    if (mode === 'scalp') { setTf('5m'); setSpeed(ROUND.scalp.speed); }
    const B = perDisplayed(tf);
    roundStartAbs = absCount();
    roundLenBase = (ROUND[mode] && ROUND[mode].len ? ROUND[mode].len : 0) * B;
    roundEntryBase = (ROUND[mode] && ROUND[mode].entryAt ? ROUND[mode].entryAt : 0) * B;
    setPaused(false);
    stats(); draw();
  };

  let exitDir = 1;   /* direction of the auto-entry in exit mode */

  /* ---- the record: drill rounds, kept on this device ---- */
  const KEY = 'rz.trading.v1';
  const loadRec = () => {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Array.isArray(r.rounds) ? r.rounds : [];
    } catch (e) { return []; }
  };
  const saveRec = rounds => localStorage.setItem(KEY, JSON.stringify({ rounds }));

  const recEl = document.getElementById('rec');
  const recListEl = document.getElementById('reclist');
  const renderRec = () => {
    const rec = loadRec();
    const rows = MODES.slice(1).map(m => {
      const rs = rec.filter(r => r.m === m);
      if (!rs.length) return '';
      const n = rs.length;
      const win = Math.round(rs.filter(r => +r.ret > 0).length / n * 100);
      const avg = rs.reduce((s, r) => s + (+r.ret || 0), 0) / n;
      let extra = '';
      if (m === 'swing') extra = `best ${Math.max(...rs.map(r => +r.score || 0))}`;
      else if (m === 'scalp') extra = `best ${pctf(Math.max(...rs.map(r => +r.ret || 0)))}`;
      else if (m === 'compound') {
        const a = rs.reduce((s, r) => s + (+r.adds || 0), 0);
        const h = rs.reduce((s, r) => s + (+r.addsHit || 0), 0);
        extra = `adds ${h}/${a}`;
      } else if (m === 'exit') extra = `avg ${Math.round(rs.reduce((s, r) => s + (+r.score || 0), 0) / n)}`;
      return `<li><span class="rname">${m}</span>${n} · ${win}% · ${pctf(avg)} · ${extra}</li>`;
    }).filter(Boolean);
    recListEl.innerHTML = rows.length ? rows.join('') : '<li>no rounds yet.</li>';
  };

  const saveRound = round => {
    const rec = loadRec();
    rec.push(round);
    saveRec(rec);
    if (!recEl.hidden) renderRec();
  };

  const endRound = () => {
    if (mode === 'exit' && lots.length) exitRealized = openPnl() / START;
    closeAll();
    roundOn = false;
    setPaused(true);
    const cs = closes();
    const ret = equity / START - 1;
    let text = '', good = false, roundScore = null;

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
      roundScore = score;
      text = `${pctf(ret)} · best ride ${pctf(bench)} · ${score}`;
    } else if (mode === 'scalp') {
      good = ret > 0;
      text = `${pctf(ret)} · ${trades} trade${trades === 1 ? '' : 's'}`;
    } else if (mode === 'compound') {
      good = ret > 0 && adds > 0 && addsInProfit === adds;
      text = `${pctf(ret)} · adds in profit ${addsInProfit}/${adds}`;
    } else if (mode === 'exit') {
      const e = exitRealized !== null ? exitRealized : 0;
      const after = cs.slice(roundEntryBase);
      const entryP = after.length ? after[0] : price;
      const best = exitDir > 0
        ? Math.max(...after) / entryP - 1
        : 1 - Math.min(...after) / entryP;
      const score = best > 0 ? Math.min(100, Math.max(0, Math.round(e / best * 100))) : 0;
      good = score >= 80;
      roundScore = score;
      text = `exit ${pctf(e)} · best ${pctf(Math.max(best, 0))} · ${score}`;
    }
    verdictEl.innerHTML = `<span${good ? ' class="good"' : ''}>${text}</span> · press to redeal`;
    saveRound({
      d: new Date().toISOString().slice(0, 10),
      m: mode, s: seedHex, tf,
      ret: +ret.toFixed(4), dd: +maxdd.toFixed(4),
      trades, score: roundScore, adds, addsHit: addsInProfit
    });
    stats(); draw();
  };

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

  let p2y = null, vLo = 0, vHi = 1;
  const y2p = y => vLo + ((H - y) / H) * (vHi - vLo);

  /* marked levels — hold to place, hold on one to remove. prices, so they
     persist across every timeframe: mark the monthly, trade the hour. */
  const levels = [];

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const view = viewCandles();
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
  const BASE_MS = 420;   /* a displayed candle ~2.5s at 1x, whatever the timeframe */
  const loop = () => {
    const now = performance.now();
    if (!paused) {
      if (lastT) roundMs += now - lastT;
      const n = ticksPerStep();
      for (let i = 0; i < n; i++) step();
      if (!roundOn) trim();
      if (roundOn) {
        const cfg = ROUND[mode];
        if (mode === 'exit' && !autoOpened && roundBase() >= roundEntryBase) {
          exitDir = rand() < 0.5 ? 1 : -1;
          openLot(exitDir, 1);
          autoOpened = true;
        }
        const done = cfg.ms ? roundMs >= cfg.ms : roundBase() >= roundLenBase;
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

  /* record panel */
  document.getElementById('rectoggle').addEventListener('click', () => {
    recEl.hidden = !recEl.hidden;
    if (!recEl.hidden) renderRec();
  });
  document.getElementById('rexport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ rounds: loadRec() }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trading-record.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const fileEl = document.getElementById('rfile');
  document.getElementById('rimport').addEventListener('click', () => fileEl.click());
  fileEl.addEventListener('change', () => {
    const f = fileEl.files[0];
    if (!f) return;
    f.text().then(t => {
      try {
        const incoming = JSON.parse(t);
        const rounds = Array.isArray(incoming.rounds) ? incoming.rounds : [];
        const seen = new Set(loadRec().map(r => JSON.stringify(r)));
        const merged = loadRec().concat(rounds.filter(r => !seen.has(JSON.stringify(r))));
        merged.sort((a, b) => String(a.d).localeCompare(String(b.d)));
        saveRec(merged);
        renderRec();
      } catch (e) { /* not a record file — ignore */ }
      fileEl.value = '';
    });
  });

  /* ---- mode + timeframe rows ---- */
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

  const tfsEl = document.getElementById('tfs');
  const renderTfs = () => {
    tfsEl.innerHTML = TF_ORDER.map(t =>
      `<button class="mode${t === tf ? ' on' : ''}" data-t="${t}">${t}</button>`
    ).join('');
  };
  const setTf = t => { tf = t; renderTfs(); draw(); };
  tfsEl.addEventListener('click', e => {
    const t = e.target.dataset && e.target.dataset.t;
    if (t && t !== tf) setTf(t);
  });

  /* ---- go ---- */
  renderModes();
  renderTfs();
  setMarket(firstSeed);
  resetAccount();
  stats(); draw(); loop();
})();
