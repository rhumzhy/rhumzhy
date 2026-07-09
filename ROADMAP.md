# roadmap

## now

(nothing in flight)

## next

- [x] it2 · practice — post template, posts.json, flat archive, shipped empty
- [x] it3 · the log — habits.json + hours.json, one year-grid per habit + 30-day hours bars at /experiments/log/
- [x] it4 · curation — curation.json + /curation/ seamless stream, shipped empty
- [x] it5 · sound — mixes.json + /sound/ version-trail feed, shipped empty
- [x] it6 · predictions — predictions.json + stream-first page + calibration score, shipped empty
- [x] it7 · trading sim I — seeded engine + regimes, candle canvas, chart-is-the-control, p&l/dd
- [x] it8 · trading sim II — drill rounds (swing/scalp/compound/exit) + verdicts
- [ ] it9 · trading sim III — localStorage history, per-mode stats, export/import, polish
- [ ] it10 · trading sim IV — top-down: timeframe row (e.g. 1d · 4h · 1h · 5m) aggregating the same market, marked levels persist across timeframes; mark up high, execute low — matches how the user actually trades
- [ ] it11 · tend the tree — consistency sweep, graduate earned experiments, prune later

## later

- trading sim: real replay mode — anonymous random windows of real historical candles committed as data, identity hidden; pressure-test subskill transfer. respect the user's timeframes: 1h and above, 5m floor
- mix feedback/scoring (tiny cloudflare worker + kv, only when earned)
- more data ideas (unnamed — only if a real one appears)
- publish trading sim stats publicly (if the data earns it)

## log

- 2026-07-08 · it1 · foundation shipped — base.css, hub refactor, five trunk stubs, curation link internal, vision/roadmap/claude.md
- 2026-07-08 · it2 · practice shipped — /writing/practice/ flat archive ("write, why not"), _post.html template, empty posts.json; named "practice" not "the practice"; data-reuse principle added to vision
- 2026-07-08 · it2.1 · no page announces its own name — branch-name headings removed everywhere; "write, why not" set in italics; rule added to claude.md
- 2026-07-08 · it2.2 · the way back is an arrow alone — breadcrumb labels dropped, .back primitive in base.css (nudges left on hover); rabbit-hole / doet principle added to claude.md
- 2026-07-08 · it3 · the log shipped — /experiments/log/: one year-grid per habit (perfect day = accent in all three), 30-day hours bars (today accent) + weekly totals; data empty, awaiting first `log:` message
- 2026-07-08 · it3.1 · hours bars labeled; first habit logged (reading)
- 2026-07-08 · it4 · curation shipped — seamless single stream, title + tiny type mark only, dates/notes kept in data not display ("flow of water, no logs in it"); shipped empty
- 2026-07-08 · it5 · sound shipped — version-trail feed (older muted, latest ink, mastered final accent), audio links out; shipped empty
- 2026-07-08 · it5.1 · sound is a player — audio files live in repo (/sound/audio/), clicking a version plays inline: hairline accent seek bar, mono time; no external hosts
- 2026-07-08 · it5.2 · sound holds kinds — mix | beat | song mark next to titles (masters via status, final version accent)
- 2026-07-08 · it6 · predictions shipped — stream first (open with confidence · deadline, resolved ✓ accent / ✗ muted), calibration score in mono beneath once 5 resolved (brier-mapped, 100 prophet / 50 coin flip); shipped empty
- 2026-07-08 · it6.1 · log v2 — habits store minutes (grids unchanged, done = minutes>0), one 30-day line chart per-habit direct-labeled, work hours categorized ({"building":3,"trading":2}), bars labeled "work hours"; work = deliberate craft effort, habits separate, leisure never logged
- 2026-07-09 · tooling · /post /log /curate /mix /predict project skills; pretooluse hook makes invalid json uncommittable; sim.js seed param sanitized; noreply email + gitignore hardening
- 2026-07-09 · it8.1 · sim matches the trader — quick press trades, press-and-hold marks a level (hold again removes; levels reset per market); base pace slowed ~4x (candle ~2.5s at 1x, higher-timeframe feel); top-down timeframe view queued as it10
- 2026-07-09 · it8 · drills shipped — mode row (free · swing · scalp · compound · exit); rounds end in a one-line mono verdict (accent when earned), press to redeal on a fresh seed; swing scored vs best single ride, scalp 90s at 4x, compound trades in thirds (add to 3/3, partials off the top, adds-in-profit scored), exit = auto-entry, you pick the out, scored vs hindsight-best; entry line thickens with size
- 2026-07-08 · it7 · trading sim I shipped — seeded synthetic market (mulberry32 + gbm + 4 hidden regimes), hollow/solid ink candles on canvas, the chart is the control (above long · below short · again close), entry = accent line, mono stats (equity · % · dd · position), pause/speed/replayable seed, self-retiring first-visit hint; real replay mode queued under later
