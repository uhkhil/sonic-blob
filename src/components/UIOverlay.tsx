/**
 * @file Main UI overlay container managing panels, modal toggles, and inactivity.
 */
import React, { useState, useEffect } from 'react';
import { store } from '../store';
import { ControlPanel } from './ControlPanel';
import { AboutModal } from './AboutModal';
import { ThemeSwitcher } from './ThemeSwitcher';
import { SettingsIcon, MaximizeIcon, MinimizeIcon } from './Icons';

/**
 * Overlay component rendering UI buttons and managing mouse inactivity fading.
 */
export const UIOverlay: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Auto-hide UI on inactivity
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const handleMouseMove = () => {
      setIsVisible(true);
      if (!isPanelOpen && !isAboutOpen) {
        document.body.style.cursor = 'default';
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsVisible(false);
        if (!isPanelOpen && !isAboutOpen) {
          document.body.style.cursor = 'none';
        }
      }, 2500);
    };

    document.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Init

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(idleTimer);
      document.body.style.cursor = 'default';
    };
  }, [isPanelOpen, isAboutOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Document-level keyboard / fullscreen events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPanelOpen) setIsPanelOpen(false);
        if (isAboutOpen) setIsAboutOpen(false);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'ArrowRight') {
        store.nextTheme();
      }
      if (e.key === 'ArrowLeft') {
        store.prevTheme();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isPanelOpen, isAboutOpen]);

  const uiStyle = {
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
    transition: 'opacity 0.5s',
  } as React.CSSProperties;

  return (
    <>
      {/* Control Panel and button */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-start p-5 gap-3">
        <ControlPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />

        <button
          style={uiStyle}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsPanelOpen(!isPanelOpen);
          }}
          title="Appearance Config"
          className="pointer-events-auto cursor-pointer self-start bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <SettingsIcon />
            Controls
          </span>
        </button>
      </div>

      {/* Fullscreen button */}
      <button
        style={uiStyle}
        onClick={toggleFullscreen}
        className="absolute z-10 top-5 right-5 pointer-events-auto cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full p-2.5 transition-all duration-500 focus:outline-none"
        title="Toggle Fullscreen (F)"
      >
        {!isFullscreen ? <MaximizeIcon /> : <MinimizeIcon />}
      </button>

      {/* About button */}
      <button
        style={uiStyle}
        onClick={(e) => {
          e.stopPropagation();
          setIsAboutOpen(true);
        }}
        className="absolute z-10 bottom-5 right-5 pointer-events-auto cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 focus:outline-none"
        title="About Sonic Blob"
      >
        About
      </button>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Theme Switcher */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex justify-center transition-all duration-500"
        style={{ opacity: uiStyle.opacity }}
      >
        <ThemeSwitcher />
      </div>
    </>
  );
};
