chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Close any existing Sonic Blob tabs before opening a new one
  const visualizerUrl = chrome.runtime.getURL('index.html');
  const existing = await chrome.tabs.query({ url: visualizerUrl + '*' });
  if (existing.length > 0) {
    await chrome.tabs.remove(existing.map(t => t.id));
  }

  // Get a stream ID for the currently active tab
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });

  // Open the visualizer in a new tab, passing the streamId
  const url = chrome.runtime.getURL(`index.html?streamId=${streamId}`);
  chrome.tabs.create({ url });
});
