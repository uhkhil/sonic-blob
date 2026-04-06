/**
 * @file Unit tests for the store module
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';
import { INITIAL_THEMES } from './themes';

// Mock localStorage to avoid persist errors in Node environment
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('useStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    // Usually Zustand state persists across tests if not properly reset
    const store = useStore.getState();
    if (store.themes.length !== INITIAL_THEMES.length) {
      // reset entirely
      useStore.setState({
        activeThemeIndex: 0,
        themes: structuredClone(INITIAL_THEMES),
      });
    } else {
      store.reset();
      useStore.setState({ activeThemeIndex: 0 });
    }
    localStorageMock.clear();
  });

  it('initializes with the correct default state', () => {
    const state = useStore.getState();
    expect(state.activeThemeIndex).toBe(0);
    expect(state.themes).toHaveLength(INITIAL_THEMES.length);
    expect(state.themes[0].name).toBe(INITIAL_THEMES[0].name);
  });

  it('updates the active theme configuration', () => {
    const state = useStore.getState();
    const initialOpacity = state.themes[0].config.opacity;

    state.update({ opacity: 0.5 });

    const updatedState = useStore.getState();
    expect(updatedState.themes[0].config.opacity).toBe(0.5);
    expect(initialOpacity).not.toBe(0.5); // ensure it actually changed
  });

  it('resets the active theme configuration to initial values', () => {
    let state = useStore.getState();
    state.update({ opacity: 0.123 });
    expect(useStore.getState().themes[0].config.opacity).toBe(0.123);

    // Call reset
    useStore.getState().reset();

    state = useStore.getState();
    expect(state.themes[0].config.opacity).toBe(
      INITIAL_THEMES[0].config.opacity,
    );
  });

  it('switches to a specific theme using setTheme', () => {
    const state = useStore.getState();
    state.setTheme(2);
    expect(useStore.getState().activeThemeIndex).toBe(2);

    // Should ignore out of bounds
    useStore.getState().setTheme(999);
    expect(useStore.getState().activeThemeIndex).toBe(2);
  });

  it('navigates to next and prev themes wrapping around', () => {
    // Current is 0
    useStore.getState().prevTheme();
    // Wrap to end
    expect(useStore.getState().activeThemeIndex).toBe(
      INITIAL_THEMES.length - 1,
    );

    useStore.getState().nextTheme();
    // Wrap to start
    expect(useStore.getState().activeThemeIndex).toBe(0);

    useStore.getState().nextTheme();
    expect(useStore.getState().activeThemeIndex).toBe(1);
  });
});
