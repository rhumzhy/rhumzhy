# roadmap

## now

(nothing in flight)

## next

- [x] it2 · practice — post template, posts.json, flat archive, shipped empty
- [x] it3 · the log — habits.json + hours.json, one year-grid per habit + 30-day hours bars at /experiments/log/
- [x] it4 · curation — curation.json + /curation/ seamless stream, shipped empty
- [x] it5 · sound — mixes.json + /sound/ version-trail feed, shipped empty
- [x] it6 · predictions — predictions.json + stream-first page + calibration score, shipped empty
- [ ] it7 · trading sim I — engine (seeded gbm + regimes), candle canvas, play/pause/speed, buy/sell, p&l
- [ ] it8 · trading sim II — drill modes (swing/scalp/compound/take-profit) + scoring
- [ ] it9 · trading sim III — localStorage history, per-mode stats, export/import, polish
- [ ] it10 · tend the tree — consistency sweep, graduate earned experiments, prune later

## later

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
