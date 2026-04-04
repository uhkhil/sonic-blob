/**
 * @file Defines standard themes and their visual configurations.
 */
import type { Config } from './store';

export interface Theme {
  name: string;
  config: Config;
}

export const INITIAL_THEMES: Theme[] = [
  {
    name: 'Amethyst',
    config: {
      detail: 4,
      baseRadius: 1.55,
      rippleDepth: 1,
      sensitivity: 2.1,
      rotationSpeed: 0.2,
      audioSamples: 128,
      moveTogether: false,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#8000ff',
      accentColor: '#FF4FD8',
      bgColor: '#0F0F14',
    },
  },
  {
    name: 'Cyberpunk',
    config: {
      detail: 1,
      baseRadius: 1.6,
      rippleDepth: 1.2,
      sensitivity: 1.8,
      rotationSpeed: 0.3,
      audioSamples: 128,
      moveTogether: false,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#00858f',
      accentColor: '#FF003C',
      bgColor: '#050014',
    },
  },
  {
    name: 'Ocean Depth',
    config: {
      detail: 139,
      baseRadius: 1.5,
      rippleDepth: 0.8,
      sensitivity: 1.2,
      rotationSpeed: 0.05,
      audioSamples: 128,
      moveTogether: true,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#006994',
      accentColor: '#00FFCC',
      bgColor: '#001A33',
    },
  },
  {
    name: 'Solar Flare',
    config: {
      detail: 4,
      baseRadius: 1.45,
      rippleDepth: 1.5,
      sensitivity: 1.4,
      rotationSpeed: 0.2,
      audioSamples: 128,
      moveTogether: false,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#FF3300',
      accentColor: '#FF9900',
      bgColor: '#1A0500',
    },
  },
  {
    name: 'Monochrome',
    config: {
      detail: 1,
      baseRadius: 1.6,
      rippleDepth: 1,
      sensitivity: 1.5,
      rotationSpeed: 0.1,
      audioSamples: 128,
      moveTogether: false,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#a3a3a3',
      accentColor: '#888888',
      bgColor: '#000000',
    },
  },
  {
    name: 'Velvet Gold',
    config: {
      detail: 6,
      baseRadius: 1.52,
      rippleDepth: 0.85,
      sensitivity: 1.3,
      rotationSpeed: 0.12,
      audioSamples: 128,
      moveTogether: false,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#C89B3C',
      accentColor: '#F6D878',
      bgColor: '#140F08',
    },
  },
  {
    name: 'Ice Bloom',
    config: {
      detail: 145,
      baseRadius: 1.42,
      rippleDepth: 0.55,
      sensitivity: 1.1,
      rotationSpeed: 0.04,
      audioSamples: 128,
      moveTogether: true,
      roughness: 0.1,
      opacity: 1.0,
      primaryColor: '#8ED6FF',
      accentColor: '#E0FFFF',
      bgColor: '#03131C',
    },
  },
];
