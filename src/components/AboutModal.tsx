import React from 'react';
import { CloseIcon, WebsiteIcon, GitHubIcon, EmailIcon } from './Icons';

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
          <CloseIcon />
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
                <WebsiteIcon />
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
                <GitHubIcon />
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
                <EmailIcon />
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
