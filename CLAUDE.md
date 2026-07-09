# rhumzhy — session bootstrap

this is a personal create-in-public site that grows like a tree.
**read VISION.md, then ROADMAP.md, before doing anything.**

live at: https://rhumzhy.pages.dev (cloudflare pages, push-to-live from main)

## house style digest

- tokens live in `/assets/base.css` (`--paper --ink --muted --accent --mono --ease`) — never redefine them.
- every page: `<link rel="stylesheet" href="/assets/base.css">` + page-specific css inline in `<head>`.
- one accent, near-monochrome, lowercase copy everywhere, mono (`.mark`) for dates/labels/data.
- no build step, no framework, no dependencies, no npm — ever. the agent is the generator.
- motion budget: the `rise` reveal on load + honest hover. nothing else.
- accessible floor: 375px width works, `:focus-visible` on everything interactive, reduced-motion respected.
- title pattern (browser tab only): `page — rhumzhy`.
- the way back is an arrow alone: `<a class="back" href="/parent/" aria-label="back">←</a>` (`.back` in base.css). no labels, no page names — the arrow points; that's the signifier.
- **never put the branch name as a heading on its own page.** the page never announces itself. post titles are content, not branch names — those stay.
- the hub is the reference for cleanliness. every page should feel that bare.
- design of everyday things is the compass: the least necessary, functional, elegant.
  natural signifiers over labels; affordances people already sense (an arrow points
  home, a filled square means done, red means the one thing that matters). the site
  should feel like a rabbit hole you explore, not a building with signage.

## session protocol

**build session ("continue"):**
1. read VISION.md, then ROADMAP.md.
2. take the top unchecked item under `next` (user may override). move it to `now`.
3. **creative direction gate: before building, present the direction — layout, look,
   feel, key choices — and get the user's sign-off. build what they have in mind.**
4. build. one iteration = ONE commit (conventional, lowercase, no bot attributions,
   no session urls). push → pages deploys.
5. check live (~1 min), user reviews on their device. don't like it → `git revert` or refine.
6. update ROADMAP.md: check the item, append a log line (`- YYYY-MM-DD · itN · what shipped`).
7. done = live + user happy + roadmap updated. not done = not checked off.

**log session (data entry):** user says something like `log: read, meditated, 4.5h` or
`post: <text>` or `predict: x, 80%, by dec`. follow the matching recipe below, commit
`data: log YYYY-MM-DD` (posts: `feat(practice): <slug>`), push. batch multiple logs
into one commit. under a minute of user attention.

## recipes

the recipes below also exist as project skills (`.claude/skills/`): /post, /log,
/curate, /mix, /predict — prefer invoking the skill; these paragraphs are the
reference the skills are built from. a pretooluse hook (`.claude/hooks/validate-json.py`,
wired in `.claude/settings.json`) blocks any git commit while site json is invalid.

### add a post (from it2)
1. copy `/writing/practice/_post.html` → `/writing/practice/YYYY/MM/DD-slug.html`
2. fill date mark, lowercase title, body paragraphs
3. prepend `{"date","slug","title","path"}` to `/writing/practice/posts.json`
4. validate json parses, commit `feat(practice): <slug>`, push

### log habits / work hours (from it3, schema v2 since it7 session)
1. edit `/data/habits.json` — add `"YYYY-MM-DD": {"reading": 54, "meditation": 10}`
   (minutes per habit done that day; a habit with minutes > 0 counts as done)
2. edit `/data/hours.json` — add `"YYYY-MM-DD": {"building": 3, "trading": 2}`
   (work hours by category; bare number ok = uncategorized total. work = deliberate
   effort toward the crafts: building, trading, reselling, writing, mixing. the three
   habits are tracked separately — never double-count them. leisure is never logged.)
3. validate json parses, commit `data: log YYYY-MM-DD`, push

### add / resolve a prediction (from it6)
1. edit `/data/predictions.json` — append `{"id","statement","confidence","made","resolveBy","outcome":null,"resolved":null,"note":""}`
2. to resolve: set `outcome` true/false ("void" if annulled) + `resolved` date
3. validate json parses, commit `data: prediction <id>`, push

### add a curation (from it4)
1. edit `/data/curation.json` — prepend `{"title","type","url","note","added"}`
   (`type` ∈ art | object | website | person | music | text)
2. validate json parses, commit `data: curate <title>`, push
   note: the page shows title + tiny type only — seamless stream, no dates/notes
   in the display (they stay in the data for reuse). no images unless one truly
   earns it later.

### add a mix version (from it5)
1. copy the audio file to `/sound/audio/<slug>-v<N>.mp3` (user provides the file/path;
   must be under 25MB — cloudflare pages per-file limit; suggest compressing if over)
2. edit `/data/mixes.json` — add version `{"v","date","url":"/sound/audio/<slug>-v<N>.mp3","note"}`
   to the item's `versions` (new item: `{"title","slug","kind":"mix"|"beat"|"song","status":"in-progress","versions":[...]}`;
   mastered/finished: set `status:"master"` — the final version turns accent)
3. validate json parses, commit `feat(sound): <slug> v<N>`, push
   the page is the player: clicking a version plays it inline (hairline seek bar, mono time).

## public-repo cautions

- everything here is public: never log absences ahead of time (habits/hours reveal
  daily patterns), only upload audio with rights cleared, no personal identifiers in data.
- the pages render json with innerHTML — safe ONLY while every byte of json is
  self-authored. before any visitor-written data ever lands (mix feedback worker),
  that rendering must be hardened (escape or textContent).
- commit author uses the github noreply address; keep it that way.

## verification

no local server — iterate live.
- before commit: validate any edited json with `python3 -c "import json; json.load(open('data/x.json'))"`
- after push: wait ~1 min, then `curl -s -o /dev/null -w "%{http_code}" https://rhumzhy.pages.dev/<path>` → 200 for each new/changed path
- the real check: user taps through on their device
- rollback: one iteration = one commit → `git revert <sha>` + push undoes it cleanly
