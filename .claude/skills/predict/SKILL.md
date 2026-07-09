---
name: predict
description: Make or resolve a public prediction — "btc above 200k, 70%, by dec 31" to make one; "resolve <statement or id> right/wrong" to settle it. Updates predictions.json, commits, pushes.
---

Handle a prediction from $ARGUMENTS.

**making one:**
1. parse: statement, confidence (as 0–1; "70%" → 0.7), resolve-by date (normalize to YYYY-MM-DD; default end of stated period).
2. append to `/data/predictions.json`: `{"id":"pNNN","statement":"…","confidence":0.7,"made":"YYYY-MM-DD","resolveBy":"YYYY-MM-DD","outcome":null,"resolved":null,"note":""}` — id = next sequential.
3. validate, commit `data: predict <id>`, push. confirm.

**resolving one:**
1. find it by id or by fuzzy-matching the statement; if ambiguous, ask.
2. set `outcome` true (right) / false (wrong) / `"void"` (annulled), and `resolved` to today.
3. validate, commit `data: resolve <id>`, push. report the updated calibration if ≥5 are resolved (brier b → score = round((1−2b)×100)).
