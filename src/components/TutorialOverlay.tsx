/**
 * @file Overlay guiding the user to start audio playback.
 */
import React from 'react';

interface TutorialOverlayProps {
  visible: boolean;
}

/**
 * Full-screen overlay instructing the user to play audio when silence is detected.
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-500">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl max-w-sm text-center shadow-2xl mx-4 transform transition-all duration-500 scale-100 opacity-100 text-white">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl border border-white/20 overflow-hidden">
          <img
            src="/logo.png"
            alt="Sonic Blob Logo"
            className="w-14 h-14 object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          No Audio Detected
        </h2>
        <p className="text-white/80 mb-6 leading-relaxed text-base">
          Sonic Blob can visualize music only from the tab that is currently
          playing audio.
        </p>
        <div className="text-left bg-black/40 p-4 rounded-xl mb-6 shadow-inner border border-black/50">
          <ol className="list-decimal list-outside ml-5 text-sm text-white/90 space-y-3">
            <li>Start music on YouTube, Spotify, or another tab</li>
            <li>While on that tab, click the Sonic Blob icon</li>
          </ol>
        </div>
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">
          Waiting for music...
        </p>
      </div>
    </div>
  );
};
