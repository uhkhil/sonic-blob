import React, { useState, useEffect } from 'react';
import { ControlPanel } from './ControlPanel';

export const UIOverlay: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide UI on inactivity
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const handleMouseMove = () => {
      setIsVisible(true);
      if (!isPanelOpen) {
        document.body.style.cursor = 'default';
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsVisible(false);
        if (!isPanelOpen) {
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
  }, [isPanelOpen]);

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
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
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
  }, [isPanelOpen]);

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
          onClick={(e) => {
            e.stopPropagation();
            setIsPanelOpen(!isPanelOpen);
          }}
          className="pointer-events-auto cursor-pointer self-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Controls
          </span>
        </button>
      </div>

      {/* Fullscreen button */}
      <button
        style={uiStyle}
        onClick={toggleFullscreen}
        className="absolute z-10 top-5 right-5 pointer-events-auto cursor-pointer border-none bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-2.5 transition-all duration-500 focus:outline-none"
        title="Toggle Fullscreen (F)"
      >
        {!isFullscreen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        )}
      </button>
    </>
  );
};
