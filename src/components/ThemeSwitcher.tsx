import React, { useState, useEffect } from 'react';
import { store } from '../store';
import type { StoreState } from '../store';

export const ThemeSwitcher: React.FC = () => {
  const [state, setState] = useState<StoreState>(store.currentState);

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const displayThemeName = state.themes[state.activeThemeIndex].name;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.prevTheme();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.nextTheme();
  };

  return (
    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 pointer-events-auto">
      <button
        onClick={handlePrevious}
        className="text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent p-1.5 flex items-center justify-center rounded-full"
        title="Previous Theme"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <span className="text-white text-sm font-medium w-32 text-center tracking-wide">
        {displayThemeName}
      </span>

      <button
        onClick={handleNext}
        className="text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent p-1.5 flex items-center justify-center rounded-full"
        title="Next Theme"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};
