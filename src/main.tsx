import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

import './style.css';

const rootEl = document.getElementById('app');
if (!rootEl) throw new Error('Failed to find the root element');

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
