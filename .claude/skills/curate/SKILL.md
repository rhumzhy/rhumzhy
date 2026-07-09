---
name: curate
description: Add a kept thing to /curation/ — e.g. "the shape of design, https://shapeofdesignbook.com, text, why we make things". Updates curation.json, commits, pushes.
---

Add a curation from $ARGUMENTS.

1. parse: title, url, type (one of art | object | website | person | music | text — infer from context if omitted), optional note.
2. prepend to `/data/curation.json`: `{"title":"…","type":"…","url":"…","note":"…","added":"YYYY-MM-DD"}` (newest first). the page displays only title + type; note and date live in data for later reuse.
3. validate it parses, commit `data: curate <title>`, push. confirm to the user.
