import { useEffect, useRef } from 'react';
import { store } from '../store';
import { startAudioCapture } from '../audio';
import { BlobRenderer } from '../three/BlobRenderer';

export interface SceneProps {
  onError?: () => void;
  onSilence?: () => void;
  onAudio?: () => void;
}

export const Scene = ({ onError, onSilence, onAudio }: SceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Initialize the 3D Render Engine
    const renderer = new BlobRenderer(container, store.config);
    renderer.onAudio = onAudio;
    renderer.onSilence = onSilence;

    // 2. Subscribe to Config Changes so the blob updates dynamically
    const unsubscribe = store.subscribe((newState) => {
      const newConfig = newState.themes[newState.activeThemeIndex].config;
      renderer.updateConfig(newConfig);
    });

    // 3. Start Audio Capture and pass real-time volume data directly to the renderer
    startAudioCapture((data: Uint8Array) => {
      renderer.audioData = data;
    }).catch((err) => {
      console.error(err);
      if (onError) onError();
    });

    // 4. Clean up Memory and WebGL Context on Unmount
    return () => {
      unsubscribe();
      renderer.dispose();
    };
  }, [onAudio, onError, onSilence]);

  // The 'absolute inset-0 z-0' places the canvas in the background behind all UI elements
  return (
    <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />
  );
};
