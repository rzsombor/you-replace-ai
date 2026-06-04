# You Replace AI

A small Chrome extension (Manifest V3) that replaces the word **“AI”** with a
string of your choosing on every website. Flip it on or off from the toolbar
popup; changes apply to open tabs instantly.

<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="You Replace AI icon" />
</p>

## Features

- **Whole-word matching, any case** — replaces `AI`, `ai`, `Ai`, `aI`, and the
  plural `AIs` only when they stand alone. Words like *maintain*, *rain*, and
  *said* are never touched.
- **Live updates** — change the replacement text or toggle the extension and
  open tabs update immediately, no reload required.
- **Reversible** — turning it off restores the original text.
- **Safe by default** — never rewrites text inside `<script>`, `<style>`,
  form fields, or `contenteditable` regions, so it won't corrupt code or what
  you're typing.
- **Works everywhere** — runs on all sites and inside iframes, and keeps up
  with dynamically loaded content via a `MutationObserver`.
- **No tracking, no network access** — settings live in `chrome.storage.sync`;
  the only permission requested is `storage`.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome (or any Chromium browser).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this project folder (the one containing
   `manifest.json`).
4. The **You Replace AI** icon appears in the toolbar. Click it to set your
   replacement word and toggle it on/off.

The default replacement is `oompa loompa` and the extension starts **on**.

## Usage

Click the toolbar icon to open the popup:

- **On/Off switch** — enable or disable replacement globally.
- **Replace “AI” with** — the text to substitute. Saved automatically as you
  type.

## Project layout

```
you-replace-ai/
├── manifest.json        # MV3 manifest: storage permission, content script, action popup
├── src/
│   ├── content.js       # Finds and replaces text; observes DOM changes; reversible
│   ├── popup.html       # Toolbar popup markup
│   ├── popup.js         # Reads/writes settings in chrome.storage.sync
│   └── popup.css        # Popup styling (light + dark)
├── icons/               # 16 / 32 / 48 / 128 px PNG icons
├── LICENSE
└── README.md
```

## How it works

- `content.js` walks the page's text nodes with a `TreeWalker` and rewrites any
  match of `/\bAIs?\b/gi`. It remembers each node's original text in a `Map`,
  which is what makes toggling off (revert) and changing the word (re-apply)
  work without a reload.
- A `MutationObserver` watching `childList` + `subtree` handles content that
  loads after the initial page render (SPAs, infinite scroll, etc.).
- The popup only reads and writes two values — `enabled` and `replacement` — to
  `chrome.storage.sync`. The content script listens to `storage.onChanged` and
  reacts, so the popup never needs to message tabs directly.

## Development

There is **no build step** — the extension is plain HTML/CSS/JS loaded directly.
Edit a file, then click the reload icon on the extension card in
`chrome://extensions` to pick up changes. For content-script changes, also
reload the page you're testing.

### Packaging for the Chrome Web Store

Zip the extension contents (not the repo metadata):

```sh
zip -r you-replace-ai.zip manifest.json src icons LICENSE README.md
```

The resulting `*.zip` is git-ignored.

## License

[MIT](LICENSE) © 2026 Zsombor Erdődy-Nagy
