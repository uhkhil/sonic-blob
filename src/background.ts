/**
 * @fileoverview Background script for the Sonic Blob Chrome Extension.
 *
 * This file runs in the background and is responsible for:
 * 1. Handling the extension action click (extension icon in the toolbar).
 * 2. Managing the lifecycle of the visualizer tab (ensuring only one instance runs).
 * 3. Handling runtime messages to provide fresh media stream IDs for audio capture via `chrome.tabCapture`.
 */

/**
 * Closes any existing Sonic Blob visualizer tabs.
 * This ensures only one visualizer instance runs at a time.
 */
async function closeExistingVisualizerTabs(): Promise<void> {
  const visualizerUrl = chrome.runtime.getURL('index.html');
  const existing = await chrome.tabs.query({ url: visualizerUrl + '*' });
  if (existing.length > 0) {
    const ids = existing
      .map((t) => t.id)
      .filter((id): id is number => id !== undefined);
    if (ids.length > 0) {
      await chrome.tabs.remove(ids);
    }
    // Small delay to ensure tabs are fully removed and resources freed
    await new Promise((r) => setTimeout(r, 100));
  }
}

/**
 * Handles the action click event. Closes existing visualizers and
 * opens a new visualizer targeting the clicked tab's audio.
 *
 * @param tab - The Chrome tab that was active when the extension action was clicked.
 */
async function handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return;

  await closeExistingVisualizerTabs();

  // Get the target tab ID (the tab whose audio we want to capture)
  const targetTabId = tab.id;

  // Open the visualizer in a new tab, passing THE TARGET TAB ID (not the streamId)
  // This allows the visualizer to request fresh streamId tokens as needed.
  const url = chrome.runtime.getURL(`index.html?targetTabId=${targetTabId}`);
  chrome.tabs.create({ url });
}

/**
 * Handles messages sent from the visualizer or other parts of the extension.
 * Currently supports requesting a fresh media stream ID for tab capture.
 *
 * @param message - The message object containing the request details.
 * @param _sender - The sender of the message.
 * @param sendResponse - Callback function to send a response back to the sender.
 * @returns True if the response will be sent asynchronously, otherwise void.
 */
function handleRuntimeMessage(
  message: { type?: string; targetTabId?: number },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
): boolean | void {
  if (message.type === 'GET_STREAM_ID' && message.targetTabId) {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: message.targetTabId },
      (streamId) => {
        sendResponse({ streamId });
      },
    );
    return true; // Keep message channel open for async response
  }
}

// Register event listeners
chrome.action.onClicked.addListener(handleActionClick);
chrome.runtime.onMessage.addListener(handleRuntimeMessage);
