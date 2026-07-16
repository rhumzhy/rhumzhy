# roadmap

## now

- [ ] it12 · space — the sound room: 3-axis visualizer (x placement · y frequency · z loudness) + depth volume, wall eq, width brackets

## next

- [x] it2 · practice — post template, posts.json, flat archive, shipped empty
- [x] it3 · the log — habits.json + hours.json, one year-grid per habit + 30-day hours bars at /experiments/log/
- [x] it4 · curation — curation.json + /curation/ seamless stream, shipped empty
- [x] it5 · sound — mixes.json + /sound/ version-trail feed, shipped empty
- [x] it6 · predictions — predictions.json + stream-first page + calibration score, shipped empty
- [x] it7 · trading sim I — seeded engine + regimes, candle canvas, chart-is-the-control, p&l/dd
- [x] it8 · trading sim II — drill rounds (swing/scalp/compound/exit) + verdicts
- [x] it9 · trading sim III — round record in localStorage, per-mode summary panel, export/import
- [x] it10 · trading sim IV — top-down: 1M · 1w · 1d · 4h · 1h · 5m over one market, adaptive pacing, levels persist across views
- [ ] it11 · tend the tree — consistency sweep, graduate earned experiments, prune later
- [x] it14 · notes — dump now, sort later: capture (enter saves, one pile) + sort workbench (j/k/x triage, 1–9 file to group, side-by-side panes, merge/split/archive), IndexedDB, documented schema, export json/md + import; voice memos next iteration
- [x] it13 · speech — the retrieval drill: 3-min speak → web-speech transcript → composite score (fillers 35 · pauses 20 · vocab 20 · rhythm 15 · metaphor 10*), best-to-beat, localStorage record + export/import, paste fallback; all client-side, zero cost

## later

- trading sim: real replay mode — anonymous random windows of real historical candles committed as data, identity hidden; pressure-test subskill transfer. respect the user's timeframes: 1h and above, 5m floor
- mix feedback/scoring (tiny cloudflare worker + kv, only when earned)
- more data ideas (unnamed — only if a real one appears)
- publish trading sim stats publicly (if the data earns it)

## log

- 2026-07-16 · it14 · notes shipped — /experiments/notes/: dump now, sort later. capture mode is the bare page (cursor ready, enter saves and clears, everything lands in one timestamped pile); sort mode is the workbench — j/k/x keyboard triage, 1–9 files to groups, n names a new one, side-by-side editable panes with merge-selected-in and split-on-`---`, archive. IndexedDB (schema documented in-page and stamped into exports: rhumzhy-notes/1, audio field reserved for voice iteration), export json + markdown, import merges by id. first tool built under the standing principles from day one; mobile = tap select, tap group to file
- 2026-07-16 · it13 · speech shipped — /experiments/speech/: the retrieval drill. 3-min speak → web-speech transcript → weighted composite (fillers 35 · pauses 20 · vocab/mattr 20 · rhythm-variance 15 · metaphor 10*, approx). daily sub-target is a cue only so the trend stays comparable; segments come from pause-gap phrasing, pause discipline from a best-effort audio meter (falls back to segment count). localStorage record + export/import, paste fallback where the speech api is absent; recordings never leave the device. all client-side, zero cost. weighted toward the hesitation axis — retrieval-speed is the gate
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
- 2026-07-12 · art · the ouroboros — procedural ascii serpent on the hub, right of the nav (level with experiments, mirrored margins), rotating one turn ~20s with a faint breath; muted mono, hidden under 760px, still frame for reduced-motion
- 2026-07-12 · art.4 · the piece is chosen — user's own upload (dense &-shade ascii, 80×199) set permanently beside the nav, auto-sized per screen; audition switcher and json deleted, hub bare again
- 2026-07-12 · art.3 · the real ouroboros — hand-made braille dot-art coiled dragon (the user's reference piece, found as text on emojicombos), shimmer wave sweeps through it instead of rotation; art itself never changes
- 2026-07-12 · art.2 · the serpent became a dragon — fixed head (eye, jaw) at the gap, scales flow forever into the mouth, spines ripple along the back, wings beat over the top arc; on mobile it now shows below the words, scaled to fit, left-aligned
- 2026-07-12 · it10 · top-down shipped — timeframe row 1M · 1w · 1d · 4h · 1h · 5m, one market aggregated truly (5m live tape + ~3y daily pre-history for the HTFs), time moves at the pace of the watched timeframe (capped at daily rate for 1w/1M), levels persist across views, vol recalibrated to scale honestly (~0.15% 5m → ~2.5% 1d → ~14% 1M), drills inherit their start timeframe (scalp forces 5m), record rounds now store tf
- 2026-07-12 · it9 · the record shipped — every drill round saved locally (date · mode · seed · return · dd · score), "record" in the control cluster unfolds per-mode lines (rounds · win% · avg return · best), export/import json so nothing is trapped; seeds kept so any recorded market can be replayed
- 2026-07-09 · it8.1 · sim matches the trader — quick press trades, press-and-hold marks a level (hold again removes; levels reset per market); base pace slowed ~4x (candle ~2.5s at 1x, higher-timeframe feel); top-down timeframe view queued as it10
- 2026-07-09 · it8 · drills shipped — mode row (free · swing · scalp · compound · exit); rounds end in a one-line mono verdict (accent when earned), press to redeal on a fresh seed; swing scored vs best single ride, scalp 90s at 4x, compound trades in thirds (add to 3/3, partials off the top, adds-in-profit scored), exit = auto-entry, you pick the out, scored vs hindsight-best; entry line thickens with size
- 2026-07-08 · it7 · trading sim I shipped — seeded synthetic market (mulberry32 + gbm + 4 hidden regimes), hollow/solid ink candles on canvas, the chart is the control (above long · below short · again close), entry = accent line, mono stats (equity · % · dd · position), pause/speed/replayable seed, self-retiring first-visit hint; real replay mode queued under later
