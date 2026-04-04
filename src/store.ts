import { INITIAL_THEMES } from './themes';
import type { Theme } from './themes';

export type Config = {
  detail: number;
  baseRadius: number;
  rippleDepth: number;
  sensitivity: number;
  rotationSpeed: number;
  audioSamples: number;
  moveTogether: boolean;
  roughness: number;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
};

export interface StoreState {
  activeThemeIndex: number;
  themes: Theme[];
}

type Listener = (state: StoreState) => void;

class Store {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();
  private readonly STORAGE_KEY = 'sonic_blob_themes_v2';

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic migration/validation
        if (
          Array.isArray(parsed.themes) &&
          typeof parsed.activeThemeIndex === 'number'
        ) {
          // Reconcile saved themes with INITIAL_THEMES so new themes added to the code show up
          const mergedThemes = INITIAL_THEMES.map((initialTheme) => {
            const savedTheme = parsed.themes.find(
              (t: Theme) => t.name === initialTheme.name,
            );
            if (savedTheme && savedTheme.config) {
              return {
                ...initialTheme,
                config: { ...initialTheme.config, ...savedTheme.config },
              };
            }
            return JSON.parse(JSON.stringify(initialTheme));
          });

          const validIndex =
            parsed.activeThemeIndex >= 0 &&
            parsed.activeThemeIndex < mergedThemes.length
              ? parsed.activeThemeIndex
              : 0;

          this.state = {
            activeThemeIndex: validIndex,
            themes: mergedThemes,
          };
        } else {
          this.state = this.createInitialState();
        }
      } catch (e) {
        console.error(e);
        this.state = this.createInitialState();
      }
    } else {
      this.state = this.createInitialState();
    }
  }

  private createInitialState(): StoreState {
    // Deep copy INITIAL_THEMES to avoid mutating the exported constant
    return {
      activeThemeIndex: 0,
      themes: JSON.parse(JSON.stringify(INITIAL_THEMES)),
    };
  }

  get currentState(): StoreState {
    return this.state;
  }

  // Gets the current active theme config
  get config(): Config {
    return this.state.themes[this.state.activeThemeIndex].config;
  }

  // Gets the active theme name
  get activeThemeName(): string {
    return this.state.themes[this.state.activeThemeIndex].name;
  }

  // Update actively selected theme's config
  update(partial: Partial<Config>) {
    const activeIndex = this.state.activeThemeIndex;
    this.state.themes[activeIndex].config = {
      ...this.state.themes[activeIndex].config,
      ...partial,
    };
    this.save();
    this.notify();
  }

  // Reset ONLY the active theme back to its initial value
  reset() {
    const activeIndex = this.state.activeThemeIndex;
    const initialTheme = INITIAL_THEMES[activeIndex];
    this.state.themes[activeIndex].config = { ...initialTheme.config };
    this.save();
    this.notify();
  }

  setTheme(index: number) {
    if (index >= 0 && index < this.state.themes.length) {
      this.state.activeThemeIndex = index;
      this.save();
      this.notify();
    }
  }

  nextTheme() {
    const nextIndex =
      this.state.activeThemeIndex === this.state.themes.length - 1
        ? 0
        : this.state.activeThemeIndex + 1;
    this.setTheme(nextIndex);
  }

  prevTheme() {
    const prevIndex =
      this.state.activeThemeIndex === 0
        ? this.state.themes.length - 1
        : this.state.activeThemeIndex - 1;
    this.setTheme(prevIndex);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  }

  private notify() {
    // Pass a new object reference to trigger React updates
    this.listeners.forEach((l) => l({ ...this.state }));
  }
}

export const useStore = () => {
  return store;
};

export const store = new Store();
