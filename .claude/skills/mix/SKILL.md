---
name: mix
description: Post a version of a mix/beat/song to /sound/ — e.g. "night drive v2, ~/exports/nd2.mp3, vocal sits better" (add "mastered" when final). Copies the audio into the repo, updates mixes.json, commits, pushes.
---

Post a sound version from $ARGUMENTS.

1. parse: title + version number, path to the audio file, optional note, optional kind (mix | beat | song), optional "mastered".
2. check the file is under 25MB (cloudflare pages per-file limit) — if over, tell the user and suggest re-exporting at a lower bitrate; do not commit an oversized file. only mp3 (or other web-playable) formats; raw wav/aiff/flac are gitignored by design.
3. copy it to `/sound/audio/<slug>-v<N>.mp3` (slug = kebab-case title).
4. edit `/data/mixes.json`: new item → `{"title":"…","slug":"…","kind":"…","status":"in-progress","versions":[…]}`; existing item → append `{"v":N,"date":"YYYY-MM-DD","url":"/sound/audio/<slug>-v<N>.mp3","note":"…"}` to its versions. if "mastered": set `status:"master"`.
5. validate it parses, commit `feat(sound): <slug> v<N>`, push. after ~1 min curl the audio url for 200 and confirm.
