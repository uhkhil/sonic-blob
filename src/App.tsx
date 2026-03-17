import React from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';

import './style.css';

export const App: React.FC = () => {
  return (
    <div className="w-full h-full relative">
      <Scene />
      <UIOverlay />
    </div>
  );
};
