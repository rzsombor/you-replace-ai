// You Replace AI — popup logic
//
// The popup is a thin editor over chrome.storage.sync. The content script
// watches the same storage and updates pages live, so there's nothing to
// message directly.

const DEFAULTS = { enabled: true, replacement: "oompa loompa" };

const enabledEl = document.getElementById("enabled");
const enabledLabel = document.getElementById("enabled-label");
const replacementEl = document.getElementById("replacement");
const statusEl = document.getElementById("status");

function reflect() {
  enabledLabel.textContent = enabledEl.checked ? "On" : "Off";
  replacementEl.disabled = !enabledEl.checked;
}

function flash(message) {
  statusEl.textContent = message;
}

// Load current settings into the form.
chrome.storage.sync.get(DEFAULTS, (s) => {
  enabledEl.checked = s.enabled;
  replacementEl.value = s.replacement;
  reflect();
});

enabledEl.addEventListener("change", () => {
  reflect();
  chrome.storage.sync.set({ enabled: enabledEl.checked });
  flash(enabledEl.checked ? "Enabled." : "Disabled.");
});

// Debounce writes while typing so we don't hammer storage on every keystroke.
let saveTimer = null;
replacementEl.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.sync.set({ replacement: replacementEl.value });
    flash("Saved.");
  }, 250);
});
