/**
 * @file Theme configuration and state management store for the application.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_THEMES } from './themes';
import type { Theme, Config } from './themes';

export interface StoreState {
  activeThemeIndex: number;
  themes: Theme[];
  update: (partial: Partial<Config>) => void;
  reset: () => void;
  setTheme: (index: number) => void;
  nextTheme: () => void;
  prevTheme: () => void;
}

const STORAGE_KEY = 'sonic_blob_themes_v2';

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      activeThemeIndex: 0,
      // Deep copy INITIAL_THEMES to avoid mutating the exported constant
      themes: structuredClone(INITIAL_THEMES),

      update: (partial) =>
        set((state) => {
          console.log('[Store: update]', partial);
          const newThemes = [...state.themes];
          newThemes[state.activeThemeIndex] = {
            ...newThemes[state.activeThemeIndex],
            config: { ...newThemes[state.activeThemeIndex].config, ...partial },
          };
          return { themes: newThemes };
        }),

      reset: () =>
        set((state) => {
          console.log('[Store: reset]');
          const newThemes = [...state.themes];
          const initialTheme = INITIAL_THEMES[state.activeThemeIndex];
          newThemes[state.activeThemeIndex] = {
            ...newThemes[state.activeThemeIndex],
            config: { ...initialTheme.config },
          };
          return { themes: newThemes };
        }),

      setTheme: (index) =>
        set((state) => {
          console.log('[Store: setTheme]', index);
          if (index >= 0 && index < state.themes.length) {
            return { activeThemeIndex: index };
          }
          return state;
        }),

      nextTheme: () =>
        set((state) => {
          console.log('[Store: nextTheme]');
          return {
            activeThemeIndex:
              state.activeThemeIndex === state.themes.length - 1
                ? 0
                : state.activeThemeIndex + 1,
          };
        }),

      prevTheme: () =>
        set((state) => {
          console.log('[Store: prevTheme]');
          return {
            activeThemeIndex:
              state.activeThemeIndex === 0
                ? state.themes.length - 1
                : state.activeThemeIndex - 1,
          };
        }),
    }),
    {
      name: STORAGE_KEY,
      merge: (persistedState: unknown, currentState) => {
        const state = persistedState as Partial<StoreState>;
        if (!state || typeof state !== 'object') {
          return currentState;
        }

        // Basic validation and reconciliation
        if (
          Array.isArray(state.themes) &&
          typeof state.activeThemeIndex === 'number'
        ) {
          const mergedThemes = INITIAL_THEMES.map((initialTheme) => {
            const savedTheme = state.themes?.find(
              (t: Theme) => t.name === initialTheme.name,
            );
            if (savedTheme && savedTheme.config) {
              return {
                ...initialTheme,
                config: { ...initialTheme.config, ...savedTheme.config },
              };
            }
            return structuredClone(initialTheme);
          });

          const validIndex =
            state.activeThemeIndex >= 0 &&
            state.activeThemeIndex < mergedThemes.length
              ? state.activeThemeIndex
              : 0;

          return {
            ...currentState,
            activeThemeIndex: validIndex,
            themes: mergedThemes,
          };
        }

        return currentState;
      },
    },
  ),
);
