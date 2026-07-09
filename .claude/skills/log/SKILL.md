---
name: log
description: Log today's habits (minutes) and/or work hours (by category) — e.g. "read 54m, meditated 10m, work 3h building, 2h trading". Edits the data files, commits, pushes.
---

Log the day from $ARGUMENTS (default date: today; honor an explicit date if given).

1. parse habit mentions into minutes: reading, meditation, exercise (e.g. "read 54m" → `"reading": 54`; a bare "meditated" with no duration → ask, or use 1 if the user just wants it marked done).
2. parse work mentions into hour categories (e.g. "work 3h building, 2h trading" → `{"building": 3, "trading": 2}`). work = deliberate craft effort; the three habits are never double-counted as work; leisure is never logged.
3. edit `/data/habits.json` — merge into `log["YYYY-MM-DD"]` (object of habit → minutes).
4. edit `/data/hours.json` — merge into `log["YYYY-MM-DD"]` (object of category → hours).
5. validate both parse, commit `data: log YYYY-MM-DD` (one commit even for multiple entries), push. confirm streak/total to the user.
