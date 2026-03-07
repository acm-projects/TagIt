const enableSidePanelOnClick = async () => {
  try {
    // Let the extension toolbar icon open the Chrome side panel directly.
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Unable to enable side panel on action click.", error);
  }
};

void enableSidePanelOnClick();

chrome.runtime.onInstalled.addListener(() => {
  void enableSidePanelOnClick();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "OPEN_TAGIT_PANEL") {
    return;
  }

  const tabId = sender.tab?.id;

  if (tabId == null) {
    sendResponse({ ok: false });
    return;
  }

  chrome.sidePanel
    // Open the panel for the tab that owns the injected page button.
    .open({ tabId })
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("Unable to open side panel.", error);
      sendResponse({ ok: false });
    });

  return true;
});
