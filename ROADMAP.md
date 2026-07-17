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
- [x] it15 · type — the writing room (descends from notes): a page that is paper. real typeface, ~66ch measure, typewriter scroll, everything but the current paragraph recedes, chrome fades while writing, caret is the only colour. title + body, markdown out, copy clean to substack. local-first. for whoever writes, not just the author. the gallery ("every piece saved as the art it becomes") is a later iteration, not this one

## later

- notes: voice memos — record in capture mode, web-speech transcription, audio field already reserved in schema
- speech: polish pass — document localStorage schema in-page (agent-accessible principle), sparkline last-point clipping, record-button focus ring, silence-threshold tuning
- trading sim: real replay mode — anonymous random windows of real historical candles committed as data, identity hidden; pressure-test subskill transfer. respect the user's timeframes: 1h and above, 5m floor
- lineage mark — experiments that descend from another whisper it on the /experiments/ index only (hover/focus over the name reveals a muted mono "fka notes"); never on the page itself, the page still never announces itself. desktop-only by design — hidden things may be hard to find. promote to base.css when a second descendant exists, not before
- agent marks your writing — the teacher-grading loop, and it needs no server: annotations are just data ({kind:"highlight", range:[..]} / {kind:"bubble", text:".."}) in the export. agent writes them, page renders them, import merges by id. turn-based like handing in a paper — real-time is a feeling, not the value
- eisenhower matrix — a view over notes, not a new tool: agent assigns, site draws the 2×2. wants its own `quadrant` field so `cluster` stays topical (a note has only one cluster; spending it on the matrix costs you topic grouping)
- visitor's own agent via remote mcp — the honest shape of "connect your claude to the site", but it needs a worker (breaks local-first + no-backend) and would put private writing on a server. only if something public ever earns it. a local skill does the same job for one person, for free
- file system access api — page and agent share one real file on disk; marks appear while you watch, no server, still local-first. chrome desktop only, no ios. the cheap version of the magic, if export/import ever grates
- mix feedback/scoring (tiny cloudflare worker + kv, only when earned)
- more data ideas (unnamed — only if a real one appears)
- publish trading sim stats publicly (if the data earns it)

## log

- 2026-07-16 · it15 · type shipped — /experiments/type/: the writing room, first branch grown from another (notes). the page is paper. newsreader, self-hosted (OFL beside it): variable with an optical-size axis, so the title is drawn with a display cut and the body with a text cut from one file — the thing substack can't do, and the reason the 132kb earns its place. 66ch measure, 1.75 leading, caret the only colour on screen. the line you're on locks at 40% and the paper moves under it. while you type the world recedes — chrome and every other paragraph, one gesture, restored the instant you touch the mouse; the dim is transient by design, since muted-on-paper is ~2.4:1 and would fail the contrast floor if it ever persisted while reading. contenteditable (a textarea can't dim a paragraph or find its caret), paste forced to plain text. localStorage `rhumzhy-type/1` documented in-page, blocks stored as plain text never markup; copy emits markdown for substack, nbsp stripped. typewriter scroll is desktop-only — it fights soft keyboards — and off under reduced-motion. one piece at a time: the gallery is the next iteration
- 2026-07-16 · it15.1 · lineage — hovering `type` on /experiments/ whispers "fka notes" (muted mono, out of flow so the link's underline still measures the word). the index only: a page never announces its own past. desktop/keyboard only — hidden things may be hard to find. stays inline until a second descendant earns a promotion to base.css
- 2026-07-16 · it14.1 · the page is the input, actually — capture sat as a fixed 9rem box centred in an empty desktop page and long dumps scrolled inside the rectangle; `.capture` stops centring, `#in` takes flex:1, textarea fills the column. no behaviour change. notes is done — the next writing idea leaves home as it15 · type
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
