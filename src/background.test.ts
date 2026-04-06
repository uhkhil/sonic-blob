/**
 * @file Unit tests for the background script
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('background service worker', () => {
  beforeEach(() => {
    // Reset vi modules to ensure clean slate for mocks
    vi.resetModules();

    // Create comprehensive mock for Chrome API
    const chromeMock = {
      action: {
        onClicked: {
          addListener: vi.fn(),
        },
      },
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
        getURL: vi
          .fn()
          .mockImplementation((path) => `chrome-extension://mock-id/${path}`),
      },
      tabs: {
        create: vi.fn(),
      },
      tabCapture: {
        getMediaStreamId: vi.fn(),
      },
    };

    // Apply the mock to global context
    vi.stubGlobal('chrome', chromeMock);
  });

  it('registers correct event listeners on load', async () => {
    // We import the background script dynamically so it executes AFTER globals are set up
    await import('./background');

    expect(chrome.action.onClicked.addListener).toHaveBeenCalled();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('handles action click by creating a new tab with correct targetTabId', async () => {
    await import('./background');

    // Extract the registered listener
    const actionListener = vi.mocked(chrome.action.onClicked.addListener).mock
      .calls[0][0];

    // Simulate a tab object passed by chrome
    const mockTab = { id: 12345 } as chrome.tabs.Tab;

    // Execute the listener
    await actionListener(mockTab);

    // Assert expectations
    expect(chrome.runtime.getURL).toHaveBeenCalledWith(
      'index.html?targetTabId=12345',
    );
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://mock-id/index.html?targetTabId=12345',
    });
  });

  it('does nothing if clicked tab has no id', async () => {
    await import('./background');
    const actionListener = vi.mocked(chrome.action.onClicked.addListener).mock
      .calls[0][0];

    const mockTabNoId = {} as chrome.tabs.Tab;

    await actionListener(mockTabNoId);

    expect(chrome.runtime.getURL).not.toHaveBeenCalled();
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it('handles GET_STREAM_ID message by calling tabCapture API', async () => {
    await import('./background');

    // Extract the runtime message listener
    const messageListener = vi.mocked(chrome.runtime.onMessage.addListener).mock
      .calls[0][0];

    const sendResponseMock = vi.fn();
    const mockMessage = { type: 'GET_STREAM_ID', targetTabId: 67890 };

    // Mock the specific behavior of getting the stream ID
    vi.mocked(chrome.tabCapture.getMediaStreamId).mockImplementation(
      (options, callback) => {
        expect(options?.targetTabId).toBe(67890);
        // callback expects a streamId string
        callback('mock-stream-token');
      },
    );

    // Execute listener manually
    // params: msg, sender, sendResponse
    const returnVal = messageListener(
      mockMessage,
      {} as chrome.runtime.MessageSender,
      sendResponseMock,
    );

    // Event listener should return true to keep the message channel open
    expect(returnVal).toBe(true);
    expect(chrome.tabCapture.getMediaStreamId).toHaveBeenCalledWith(
      { targetTabId: 67890 },
      expect.any(Function),
    );

    // Verify sendResponse was called with the result inside the callback mock
    expect(sendResponseMock).toHaveBeenCalledWith({
      streamId: 'mock-stream-token',
    });
  });

  it('ignores other runtime messages', async () => {
    await import('./background');
    const messageListener = vi.mocked(chrome.runtime.onMessage.addListener).mock
      .calls[0][0];

    const sendResponseMock = vi.fn();
    const mockMessage = { type: 'SOME_OTHER_EVENT', targetTabId: 111 };

    const returnVal = messageListener(
      mockMessage,
      {} as chrome.runtime.MessageSender,
      sendResponseMock,
    );

    expect(returnVal).toBeUndefined();
    expect(chrome.tabCapture.getMediaStreamId).not.toHaveBeenCalled();
  });
});
