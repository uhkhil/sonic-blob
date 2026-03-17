chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  
  // Get a stream ID for the currently active tab
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  
  // Open the visualizer in a new tab, passing the streamId
  const url = chrome.runtime.getURL(`index.html?streamId=${streamId}`);
  chrome.tabs.create({ url });
});
