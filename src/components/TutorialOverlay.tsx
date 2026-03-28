import React from 'react';

interface TutorialOverlayProps {
  visible: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-500">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl max-w-sm text-center shadow-2xl mx-4 transform transition-all duration-500 scale-100 opacity-100 text-white">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#5A189A] to-[#FF4FD8] rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
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
