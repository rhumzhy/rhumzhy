---
name: post
description: File a practice post — the argument is the post text (optionally "title: body"). Creates the post page, updates the archive index, commits, pushes, verifies live.
---

File a daily practice post from $ARGUMENTS.

1. today = YYYY-MM-DD. title: if the input starts with `<title>: `, use it; otherwise derive a short lowercase title from the first line. slug = kebab-case of the title.
2. copy `/writing/practice/_post.html` to `/writing/practice/YYYY/MM/DD-<slug>.html` (create directories). fill: `<title><the title> — rhumzhy</title>`, the `YYYY.MM.DD` mark, the h1 title, and the body as `<p>` paragraphs. keep the user's words exactly — fix nothing unless asked. lowercase per house style.
3. prepend to `/writing/practice/posts.json`: `{"date":"YYYY-MM-DD","slug":"<slug>","title":"<title>","path":"/writing/practice/YYYY/MM/DD-<slug>.html"}` (newest first).
4. validate posts.json parses, commit `feat(practice): <slug>`, push.
5. after ~1 min, curl the new post path on https://rhumzhy.pages.dev for 200 and confirm to the user.
