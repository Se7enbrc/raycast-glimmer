# Glimmer automation fixtures

`contract-v1.json` is produced by Glimmer's actual `CommandJSON` encoder and
checked by its actual `GlimmerCLI.parseURL`, not a JavaScript imitation. The
fixture records the checkout revision and SHA-256 of both Swift source files.
`generate.swift` supplies small model stand-ins and synthetic inputs based on
`GlimmerTests/GlimmerAutomationTests.swift`; it does not launch Glimmer, probe a
PC or read saved user data. This checks serialization and URL parsing, not app
dispatch or the full Swift model implementation.

On a Mac with Swift, refresh from a reviewed Glimmer checkout:

```sh
node scripts/generate-contract-fixtures.mjs ../im
npx --no-install prettier --write tests/fixtures/glimmer/contract-v1.json
npm test
```

The generator compiles the encoder and parser directly from the supplied
checkout in a temporary directory. Source changes should be reviewed before
running it. CI uses the committed fixture and needs no sibling checkout.

The implementation on `feat/2026.10.8` and the `docs/humanize` automation and
command-line docs agree on the following contract:

- URLs accept only `stream`, `wake`, and `quit`. `pc` is required; `app` is
  optional only for `stream`. Values are decoded once, `%20` is space and `+`
  is literal. Names, IDs and saved addresses identify PCs. Unknown actions,
  duplicate/unknown parameters and control characters are rejected. Quit URLs
  require confirmation; Shortcuts' quit intent has different semantics.
- `list --json` returns `version` and `pcs`; `list <pc> --json` returns `version`
  and `apps`; `status --json` returns `version`, `live`, `pc`, `app`, `resolution`,
  `fps`, `hdr`, `codec`, and `bitrateMbps`. The fixture exercises every consumed
  field, all PC states, hidden apps, nullable identities, idle/live/reconnecting
  status and nonfinite telemetry encoded as null.
- Version 1 emits all documented keys and explicit nulls. Extra fields at any
  level are ignored. Missing nullable details are treated as unknown for
  compatibility; missing required identities, collections, flags and dimensions
  are errors. Any missing, mistyped or unsupported version is a loud error.
- JSON names can contain controls (Glimmer tests an app name containing a
  newline), while URLs cannot. Such apps remain visible, with an Open Glimmer
  action instead of an invalid stream link.
- There is no stop URL, stop CLI verb or disconnect operation in this checkout.
  Never substitute `quit` for a disconnect: it closes the PC app.
