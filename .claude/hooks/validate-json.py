#!/usr/bin/env python3
"""pretooluse hook: block git commits while any site data json is invalid."""
import glob
import json
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cmd = (payload.get('tool_input') or {}).get('command', '')
if 'git commit' not in cmd:
    sys.exit(0)

bad = []
for f in sorted(glob.glob('data/*.json')) + sorted(glob.glob('writing/practice/*.json')):
    try:
        with open(f) as fh:
            json.load(fh)
    except FileNotFoundError:
        pass
    except Exception as e:
        bad.append(f'{f}: {e}')

if bad:
    print(json.dumps({
        'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'permissionDecision': 'deny',
            'permissionDecisionReason': 'invalid json, fix before committing — ' + '; '.join(bad)
        }
    }))
