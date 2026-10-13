# Glimmer

Stream apps from your paired PCs with [Glimmer](https://github.com/Se7enbrc/glimmer), a Mac-native Sunshine game-streaming client.

## Setup

1. Install [Glimmer](https://github.com/Se7enbrc/glimmer/releases/latest) in Applications. Glimmer requires macOS 26 or later and Apple Silicon.
2. For a disk image installation, open Glimmer and choose **Glimmer › Install Command Line Tool…**. macOS asks for an administrator password to create `/usr/local/bin/glimmer`. The Homebrew cask creates the command link itself.
3. Open Glimmer and pair the PC running Sunshine. Configure streaming and Wake on LAN in Glimmer.
4. Install this extension in Raycast. Run **Stream App** or **Wake PC**. Enable **Glimmer Status** in Raycast’s extension settings to use the menu bar command.

To install Glimmer with Homebrew:

```sh
brew tap se7enbrc/glimmer
brew trust --tap se7enbrc/glimmer
brew install --cask glimmer
```

The extension checks `/usr/local/bin/glimmer`, `/opt/homebrew/bin/glimmer`, then `/Applications/Glimmer.app/Contents/MacOS/Glimmer`. The bundled executable also works without the command link. No shell profile or PATH configuration is required. Use a Glimmer release that supports the documented version 1 JSON commands.

## Commands

| Command        | What it does                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stream App     | Lists apps in sections for paired PCs. Shows Ready, Asleep, Offline, or Streaming, marks the running app, and uses Steam and Desktop icons.                                                             |
| Wake PC        | Runs `glimmer wake <pc> --wait`, shows progress, and reports whether the PC answered. Glimmer waits up to 90 seconds.                                                                                   |
| Stop Streaming | Reads fresh status. Reports “Nothing is streaming.” when idle; otherwise explains that Glimmer cannot disconnect while leaving the PC app running.                                                      |
| Glimmer Status | Shows the live PC and app, resolution, frame rate, HDR or SDR, codec, and bitrate when available. Refreshes on Raycast’s 30-second interval. Includes Stop streaming, Open Glimmer, and manual refresh. |

In **Stream App**, choose **Stream** or **Resume**, **Wake PC**, **Quit app on PC**, **Copy link**, or **Create Quicklink** from the action panel. Launching and quitting use `glimmer://` links opened by Raycast. Glimmer handles launch, takeover, and quit confirmations. A link to the current stream brings its window forward.

Quicklinks identify the PC by its saved ID and the app by name. Renaming an app can require recreating its quicklink. Spaces use `%20` and literal plus signs use `%2B`, matching Glimmer’s URL rules.

PC and app lists use Raycast’s `useCachedPromise`. Once the PC list finishes, app lists load in parallel. Each PC’s failure stays in its own section, where Wake PC and refresh remain available. Cached lists appear while refreshing; choose **Refresh apps** after changing pairing or the app library. Hidden apps are included and labeled. A running app can also be active on another device; only **Glimmer Status** describes this Mac’s live stream.

## Troubleshooting

If the command is missing, the list commands show a setup view with the download link and a copyable Homebrew command. **Stop Streaming** opens that same view; the menu bar offers **Set up Glimmer…**.

| Exit code            | Meaning and next step                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| 0                    | The request succeeded.                                                  |
| 1                    | Glimmer couldn’t complete the request. Open Glimmer and try again.      |
| 2                    | Glimmer couldn’t use the command. Update Glimmer and the extension.     |
| 3                    | The PC didn’t answer. Check its power and connection.                   |
| 4                    | The PC isn’t paired or couldn’t be found. Check its pairing in Glimmer. |
| Other or interrupted | Glimmer stopped before completing the request. Try again.               |

Malformed JSON or an unsupported JSON version produces an error instead of an empty app list or an idle status. Unknown fields are ignored; documented nullable details remain unknown. A status error is never shown as “Not streaming”.

The extension calls only Glimmer’s local command and URL automation surfaces. It makes no network requests of its own and implements no streaming, discovery, pairing, or Wake on LAN protocol. CLI arguments are passed directly without a shell. Glimmer manages pairing credentials and stream settings. Raycast caches PC names and app lists locally.

## Development

Use Node 24 and the committed lockfile:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build -- --environment dist --non-interactive --output dist
npm run dev
```

Pure parsing, exit-code, state, formatting, and URL tests can also run before installing dependencies:

```sh
node --experimental-strip-types --test tests/*.test.mjs
```

Tests require Node 22.6 or later with TypeScript stripping support. They do not launch Glimmer or contact the PC. Tests and the distribution build need no running Raycast or Glimmer app. The UI requires Raycast.

Dependencies are pinned in `package.json` and `package-lock.json`. CI checks types, Raycast lint, formatting, contract tests and a headless distribution build. See [CONTRIBUTING.md](CONTRIBUTING.md) for hooks and offline checks, and [the contract fixtures](tests/fixtures/glimmer/README.md) for their Glimmer source and refresh command.

## Store preparation

Follow Raycast’s [Prepare an Extension for Store](https://developers.raycast.com/basics/prepare-an-extension-for-store) guide. The manifest uses the noun title **Glimmer**, author **ugfuglio**, an MIT license, categories, descriptions, and a 512 × 512 PNG icon in `assets/extension-icon.png`. Command titles follow the requested names; **Glimmer Status** is the requested menu bar title. In-command copy uses sentence case.

The owner must:

1. Run the checks above with the committed lockfile and verify the Raycast author account.
2. Run `npm run dev` in Raycast and verify real PCs, Steam and Desktop, resume, URL confirmations, asleep and offline PCs, an unavailable command, a failed status request, and live stream video details. Confirm the menu bar refreshes after 30 seconds and Stop Streaming accurately reports that disconnect is unsupported. Glimmer has no stop CLI verb or URL action; quitting or closing its stream ends the PC app. Decide whether to remove Stop Streaming before submission or add an explicit disconnect contract to Glimmer first.
3. Add real screenshots to `metadata/` following the current store guide. See [the screenshot checklist](metadata/README.md). No screenshots are fabricated or included.
4. Run `npm run publish` (`ray publish`), review the generated Raycast extensions store PR, and follow Raycast’s submission workflow. Publishing and store submission are left to the owner.

## License

[MIT](LICENSE), Copyright 2026 ugfugl.io. The extension icon is copied from the owner-provided Glimmer artwork. Glimmer and Steam names and marks belong to their respective owners.
