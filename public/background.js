chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Close any existing Sonic Blob tabs before opening a new one
  const visualizerUrl = chrome.runtime.getURL('index.html');
  const existing = await chrome.tabs.query({ url: visualizerUrl + '*' });
  if (existing.length > 0) {
    await chrome.tabs.remove(existing.map(t => t.id));
    // Small delay to ensure tabs are fully removed and resources freed
    await new Promise(r => setTimeout(r, 100));
  }

  // Get the target tab ID (the tab whose audio we want to capture)
  const targetTabId = tab.id;

  // Open the visualizer in a new tab, passing THE TARGET TAB ID (not the streamId)
  // This allows the visualizer to request fresh streamId tokens as needed.
  const url = chrome.runtime.getURL(`index.html?targetTabId=${targetTabId}`);
  chrome.tabs.create({ url });
});

// Handle requests for fresh streamId tokens from the visualizer
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STREAM_ID' && message.targetTabId) {
    chrome.tabCapture.getMediaStreamId({ targetTabId: message.targetTabId }, (streamId) => {
      sendResponse({ streamId });
    });
    return true; // Keep message channel open for async response
  }
});
