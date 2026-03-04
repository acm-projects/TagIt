const BUTTON_ID = "tagit-side-button";

const injectButton = () => {
  // Avoid injecting duplicates if the content script runs more than once.
  if (!document.body || document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "TagIt";
  button.setAttribute("aria-label", "Open TagIt");

  Object.assign(button.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    zIndex: "2147483647",
    border: "none",
    borderRadius: "16px",
    background: "#c97d6e",
    color: "#ffffff",
    padding: "14px 18px",
    fontFamily: '"Instrument Serif", Georgia, serif',
    fontSize: "20px",
    fontStyle: "italic",
    lineHeight: "1",
    letterSpacing: "0.02em",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)"
  });

  button.addEventListener("mouseenter", () => {
    button.style.background = "#b86c5d";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = "#c97d6e";
  });

  button.addEventListener("click", () => {
    // Ask the background worker to open the extension side panel for this tab.
    void chrome.runtime.sendMessage({ type: "OPEN_TAGIT_PANEL" });
  });

  document.body.appendChild(button);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton, { once: true });
} else {
  injectButton();
}
