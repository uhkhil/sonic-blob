import type { Config } from './store';

export interface Theme {
  name: string;
  config: Config;
}

export const INITIAL_THEMES: Theme[] = [
  {
    name: 'Amethyst',
    config: {
      detail: 137,
      baseRadius: 1.5,
      rippleDepth: 1,
      sensitivity: 1.5,
      rotationSpeed: 0,
      audioSamples: 128,
      moveTogether: false,
      primaryColor: '#8000ff',
      accentColor: '#FF4FD8',
      bgColor: '#0F0F14',
    },
  },
  {
    name: 'Cyberpunk',
    config: {
      detail: 6,
      baseRadius: 1.6,
      rippleDepth: 1.2,
      sensitivity: 1.8,
      rotationSpeed: 0.15,
      audioSamples: 128,
      moveTogether: false,
      primaryColor: '#00F0FF',
      accentColor: '#FF003C',
      bgColor: '#050014',
    },
  },
  {
    name: 'Ocean Depth',
    config: {
      detail: 5,
      baseRadius: 1.7,
      rippleDepth: 0.8,
      sensitivity: 1.2,
      rotationSpeed: 0.05,
      audioSamples: 128,
      moveTogether: true,
      primaryColor: '#006994',
      accentColor: '#00FFCC',
      bgColor: '#001A33',
    },
  },
  {
    name: 'Forest Wisp',
    config: {
      detail: 8,
      baseRadius: 1.4,
      rippleDepth: 0.6,
      sensitivity: 2.0,
      rotationSpeed: 0.08,
      audioSamples: 128,
      moveTogether: false,
      primaryColor: '#2ECC71',
      accentColor: '#F1C40F',
      bgColor: '#0C1A10',
    },
  },
  {
    name: 'Solar Flare',
    config: {
      detail: 3,
      baseRadius: 1.8,
      rippleDepth: 1.5,
      sensitivity: 1.4,
      rotationSpeed: 0.2,
      audioSamples: 128,
      moveTogether: false,
      primaryColor: '#FF3300',
      accentColor: '#FF9900',
      bgColor: '#1A0500',
    },
  },
  {
    name: 'Monochrome',
    config: {
      detail: 4,
      baseRadius: 1.5,
      rippleDepth: 1.0,
      sensitivity: 1.5,
      rotationSpeed: 0.1,
      audioSamples: 128,
      moveTogether: false,
      primaryColor: '#FFFFFF',
      accentColor: '#888888',
      bgColor: '#000000',
    },
  },
];
