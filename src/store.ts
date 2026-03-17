export const DEFAULT_CONFIG = {
  detail: 32,
  baseRadius: 1.0,
  rippleDepth: 0.5,
  sensitivity: 1.0,
  rotationSpeed: 1.0,
  primaryColor: '#ff00ff',
  accentColor: '#00ffff',
  bgColor: '#73b2c1'
};

export type Config = typeof DEFAULT_CONFIG;

// Simple reactive store
type Listener = (config: Config) => void;

class Store {
  private state: Config;
  private listeners: Set<Listener> = new Set();

  constructor() {
    const saved = localStorage.getItem('sonic_blob_config');
    this.state = saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
  }

  get config(): Config {
    return this.state;
  }

  update(partial: Partial<Config>) {
    this.state = { ...this.state, ...partial };
    this.save();
    this.notify();
  }

  reset() {
    this.state = { ...DEFAULT_CONFIG };
    this.save();
    this.notify();
  }
  
  replace(fullConfig: Config) {
    this.state = { ...fullConfig };
    this.save();
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private save() {
    localStorage.setItem('sonic_blob_config', JSON.stringify(this.state));
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

export const useStore = () => {
  return store;
};

export const store = new Store();
