import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Close"
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold text-white mb-4">
          About Sonic Blob
        </h2>

        <div className="space-y-4 text-white/80 text-sm leading-relaxed">
          <p>
            Sonic Blob is a Chrome extension that turns audio from your browser
            tab into a live visual experience through a dynamic animated blob.
          </p>
          <p>
            I built it to create a simple and stylish music visualizer that
            works directly in the browser without needing a separate app or
            complicated setup.
          </p>
          <p>
            I am always open to suggestions and ideas for improving Sonic Blob.
            If you have feedback, notice an issue, or have a feature request,
            please feel free to send me an email.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold text-center mb-6">
            Created by <span className="text-white/90">Akhil Kumar</span>
          </p>

          <div className="flex justify-around items-center">
            <a
              href="https://akhil-kumar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all duration-300 group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/5 group-hover:border-white/20 transition-all">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Website
              </span>
            </a>

            <a
              href="https://github.com/uhkhil/sonic-blob"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all duration-300 group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/5 group-hover:border-white/20 transition-all">
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
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                GitHub
              </span>
            </a>

            <a
              href="mailto:akhilnareshkumar@gmail.com"
              className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all duration-300 group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/5 group-hover:border-white/20 transition-all">
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Email
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
