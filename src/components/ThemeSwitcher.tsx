/**
 * @file UI component for cycling through preset configuration themes.
 */
import React, { useState, useEffect, useRef } from 'react';
import { store } from '../store';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

/**
 * A horizontal selector to navigate left and right through available visual themes.
 * Uses a selective subscription to avoid re-rendering on every config change.
 */
export const ThemeSwitcher: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(
    store.currentState.activeThemeIndex,
  );
  const prevIndexRef = useRef(activeIndex);

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      // Only trigger re-render when the active theme actually changes
      if (newState.activeThemeIndex !== prevIndexRef.current) {
        prevIndexRef.current = newState.activeThemeIndex;
        setActiveIndex(newState.activeThemeIndex);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const displayThemeName = store.currentState.themes[activeIndex].name;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.prevTheme();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.nextTheme();
  };

  return (
    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-2 pointer-events-auto">
      <button
        onClick={handlePrevious}
        className="text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent p-1.5 flex items-center justify-center rounded-full"
        title="Previous Theme (←)"
      >
        <ChevronLeftIcon />
      </button>

      <span className="text-white text-sm font-medium w-32 text-center tracking-wide">
        {displayThemeName}
      </span>

      <button
        onClick={handleNext}
        className="text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-none bg-transparent p-1.5 flex items-center justify-center rounded-full"
        title="Next Theme (→)"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
};
