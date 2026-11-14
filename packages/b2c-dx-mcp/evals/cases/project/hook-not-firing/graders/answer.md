---
type: regex
# Identifies the afterPOST hook and that returning a value (the Status) skips the system implementation.
pattern: '^(?=[\s\S]*afterPOST)(?=[\s\S]*(?:return|Status))'
flags: i
---
