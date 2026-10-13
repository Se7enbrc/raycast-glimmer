# Changelog

## [Initial release] - {PR_MERGE_DATE}

- Browse apps on paired PCs and stream or resume through Glimmer.
- Wake a PC and wait for it to answer.
- Stop this Mac’s stream and quit the game on the PC after a destructive confirmation.
- Report stopped, nothing streaming, and errors from `glimmer stop --json`; use a clearly labeled URL fallback only when the CLI is missing.
- Verify stop JSON, exit codes, confirmation, and fallback behavior with regenerated Glimmer contract fixtures and command tests.
- Show stream details in the menu bar with a 30-second refresh interval.
- Copy stream links and create Raycast quicklinks.
