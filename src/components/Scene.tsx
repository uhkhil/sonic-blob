/**
 * @file The 3D scene component orchestrating the WebGL renderer and audio input.
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { startAudioCapture } from '../audio';
import { BlobRenderer } from '../three/BlobRenderer';

export interface SceneProps {
  onError?: () => void;
  onSilence?: () => void;
  onAudio?: () => void;
}

/**
 * Renders the 3D WebGL canvas that displays the reactive audio visualizer.
 */
export const Scene = ({ onError, onSilence, onAudio }: SceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Initialize the 3D Render Engine
    const initialState = useStore.getState();
    const renderer = new BlobRenderer(
      container,
      initialState.themes[initialState.activeThemeIndex].config,
    );
    renderer.onAudio = onAudio;
    renderer.onSilence = onSilence;

    // 2. Subscribe to Config Changes so the blob updates dynamically
    const unsubscribe = useStore.subscribe((newState) => {
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
