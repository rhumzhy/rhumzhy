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

(recipes are added here as each branch ships. exact files, exact steps.)

### add a post (from it2)
1. copy `/writing/practice/_post.html` → `/writing/practice/YYYY/MM/DD-slug.html`
2. fill date mark, lowercase title, body paragraphs
3. prepend `{"date","slug","title","path"}` to `/writing/practice/posts.json`
4. validate json parses, commit `feat(practice): <slug>`, push

### log habits / hours (from it3)
1. edit `/data/habits.json` — add `"YYYY-MM-DD": ["reading","meditation","exercise"]` (subset done that day)
2. edit `/data/hours.json` — add `"YYYY-MM-DD": {"h": 4.5, "note": "..."}` (bare number ok)
3. validate json parses, commit `data: log YYYY-MM-DD`, push

### add / resolve a prediction (from it6)
1. edit `/data/predictions.json` — append `{"id","statement","confidence","made","resolveBy","outcome":null,"resolved":null,"note":""}`
2. to resolve: set `outcome` true/false ("void" if annulled) + `resolved` date
3. validate json parses, commit `data: prediction <id>`, push

### add a curation (from it4)
1. edit `/data/curation.json` — prepend `{"title","type","url","image":null,"note","added"}`
   (`type` ∈ art | object | website | person | music | text; images small, under `/curation/img/`)
2. validate json parses, commit `data: curate <title>`, push

### add a mix version (from it5)
1. edit `/data/mixes.json` — add version `{"v","date","url","note"}` to the mix's `versions`
   (new mix: `{"title","slug","status":"in-progress","versions":[...]}`; master: set `status:"master"`)
2. validate json parses, commit `data: mix <slug> v<N>`, push

## verification

no local server — iterate live.
- before commit: validate any edited json with `python3 -c "import json; json.load(open('data/x.json'))"`
- after push: wait ~1 min, then `curl -s -o /dev/null -w "%{http_code}" https://rhumzhy.pages.dev/<path>` → 200 for each new/changed path
- the real check: user taps through on their device
- rollback: one iteration = one commit → `git revert <sha>` + push undoes it cleanly
