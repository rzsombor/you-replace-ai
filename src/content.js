// You Replace AI — content script
//
// Replaces the standalone word "AI" (any case) and its plural "AIs" with a
// user-chosen string on every page. The original text of every node we touch
// is remembered, so toggling the extension off or changing the replacement
// word updates open tabs live, with no page reload.

(() => {
  "use strict";

  const DEFAULTS = { enabled: true, replacement: "oompa loompa" };

  // Whole-word match for AI / ai / Ai / aI and the plural AIs (any case).
  // The \b word boundaries ensure we never touch "ai" inside words such as
  // "maintain", "rain" or "said".
  const MATCH_RE = /\bAIs?\b/gi;

  // Text inside these elements is never rewritten: scripts/styles would break,
  // and form fields hold what the user is typing.
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
  ]);

  // node -> its original (pre-replacement) text. Only nodes we actually
  // rewrite are stored, so this stays small.
  const originals = new Map();

  let settings = { ...DEFAULTS };
  let observer = null;

  function shouldSkip(textNode) {
    const parent = textNode.parentElement;
    if (!parent) return true;
    if (SKIP_TAGS.has(parent.tagName)) return true;
    if (parent.isContentEditable) return true; // also true for nested editables
    return false;
  }

  function transform(original) {
    if (!settings.enabled) return original;
    // A function replacer inserts the user's text literally, so characters
    // like "$" in the replacement are not treated as special.
    return original.replace(MATCH_RE, () => settings.replacement);
  }

  function processTextNode(node) {
    if (shouldSkip(node)) return;
    const original = originals.has(node) ? originals.get(node) : node.nodeValue;
    const next = transform(original);
    if (next !== node.nodeValue) {
      if (!originals.has(node)) originals.set(node, original);
      node.nodeValue = next;
    }
  }

  // Process a freshly added/seen subtree (or a single text node).
  function walk(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }
    if (
      root.nodeType !== Node.ELEMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) processTextNode(n);
  }

  // Re-evaluate every node we've ever rewritten. Used when settings change:
  // turning off reverts to the original, a new word re-applies from original.
  function reapplyAll() {
    for (const [node, original] of originals) {
      if (!node.isConnected) {
        originals.delete(node);
        continue;
      }
      const next = transform(original);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function startObserver() {
    if (observer) return;
    // childList + subtree (not characterData) catches dynamically added
    // content without re-firing on our own edits, avoiding any loop.
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const added of m.addedNodes) walk(added);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function init() {
    walk(document.body || document.documentElement);
    startObserver();
  }

  // Load settings, then run once the DOM is ready.
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  });

  // React to popup changes live, with no reload.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if ("enabled" in changes) settings.enabled = changes.enabled.newValue;
    if ("replacement" in changes) settings.replacement = changes.replacement.newValue;
    reapplyAll();
    // If we just turned on, also sweep nodes we hadn't touched before.
    if (settings.enabled) walk(document.body || document.documentElement);
  });
})();
