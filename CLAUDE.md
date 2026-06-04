# CLAUDE.md

Guidance for working in this repo.

## What this is

**You Replace AI** — a Chrome extension (Manifest V3) that replaces the
standalone word **"AI"** on every web page with a string the user chooses
(default `oompa loompa`). Toggle on/off and edit the replacement from the
toolbar popup; open tabs update live.

Repo: `github.com/rzsombor/you-replace-ai` · default branch `main` · no build step.

## Critical distinction: branding vs. the literal word "AI"

Two unrelated things both contain the letters "AI" — do not conflate them when
editing or renaming:

- **Branding / display name** — `You Replace AI` (manifest `name` and
  `default_title`, popup `<h1>` and `<title>`, README heading). The repo slug is
  `you-replace-ai`.
- **The literal word the extension finds and replaces** — `"AI"`. This appears
  intentionally in the manifest `description`, the popup field label
  *Replace "AI" with*, the regex `/\bAIs?\b/gi`, and `content.js` comments.
  **These must never be renamed** — they describe the feature itself.

A rename of the *project* touches only the first group. If you change the
branding, leave every functional reference to the word "AI" alone.

## Architecture

Plain HTML/CSS/JS, no bundler, no dependencies.

- `manifest.json` — MV3 manifest. Single permission: `storage`. Registers the
  content script on `<all_urls>` (`all_frames: true`, `document_idle`) and the
  action popup.
- `src/content.js` — the engine. Runs on every page/frame.
- `src/popup.{html,js,css}` — toolbar popup; a thin editor over storage.
- `icons/` — 16/32/48/128 px PNGs (binary — see Pushing below).

### State model

The only shared state is two keys in `chrome.storage.sync`:
`{ enabled: boolean, replacement: string }`, defaulting to
`{ enabled: true, replacement: "oompa loompa" }`. The default literal lives in
**both** `content.js` and `popup.js` (`DEFAULTS`) — keep them in sync if you
change it.

The popup only reads/writes storage. It never messages tabs. `content.js`
listens to `chrome.storage.onChanged` and reacts, so changes propagate to open
tabs with no reload.

### How content.js works

- Matches `/\bAIs?\b/gi` — the standalone word `AI`/`AIs`, any case. Word
  boundaries keep it from touching `maintain`, `rain`, `said`, etc.
- Walks text nodes with a `TreeWalker`; a `MutationObserver` on
  `childList + subtree` catches dynamically added content (SPAs, infinite
  scroll). It deliberately does **not** observe `characterData`, to avoid
  re-firing on its own edits.
- **Reversibility:** every node it rewrites is recorded in an `originals` Map
  (node → pre-replacement text). Toggling off reverts from originals; changing
  the replacement re-applies from originals. This is why no reload is needed.
- **Never rewrites** text in `SCRIPT/STYLE/NOSCRIPT/TEXTAREA/INPUT/SELECT/OPTION`
  or inside `contenteditable` (see `SKIP_TAGS` / `shouldSkip`).
- Replacement uses a function replacer (`() => settings.replacement`) so `$`
  in the user's string is inserted literally, not treated as a regex special.

## Testing changes

No build. Load unpacked at `chrome://extensions` (Developer mode → Load
unpacked → this folder). After editing:

- Manifest/popup changes: click the reload icon on the extension card.
- `content.js` changes: reload the extension card **and** reload the page under
  test.

## Packaging

```sh
zip -r you-replace-ai.zip manifest.json src icons LICENSE README.md
```

`*.zip` is git-ignored.

## Pushing / git

The `icons/*.png` are **binary**. The GitHub MCP `push_files` tool only carries
text and would corrupt them — use the git CLI (`git push`) for anything that
includes the icons. `.claude/settings.local.json` is git-ignored (local config).
