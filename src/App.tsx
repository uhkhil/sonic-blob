/**
 * @file Main Application component linking the 3D scene, themes, and UI.
 */
import React, { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { TutorialOverlay } from './components/TutorialOverlay';

import './style.css';

/**
 * The root Application component handling tutorial visibility and scene states.
 */
export const App: React.FC = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  const handleError = useCallback(() => setShowTutorial(true), []);
  const handleSilence = useCallback(() => setShowTutorial(true), []);
  const handleAudio = useCallback(() => setShowTutorial(false), []);

  return (
    <div className="w-full h-full relative">
      <Scene
        onError={handleError}
        onSilence={handleSilence}
        onAudio={handleAudio}
      />
      <TutorialOverlay visible={showTutorial} />
      <UIOverlay />
    </div>
  );
};
