import React, { useState, useEffect } from 'react';
import { store } from '../store';
import type { Config } from '../store';

export const ControlPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<Config>(store.config);

  useEffect(() => {
    const unsubscribe = store.subscribe(setConfig);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleChange = (key: keyof Config, value: number | string) => {
    store.update({ [key]: value });
  };

  const handleReset = () => {
    store.reset();
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(store.config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sonic-blob-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target!.result as string);
        // Basic validation logic
        const schema: Array<
          [keyof Config, 'number' | 'string', number?, number?]
        > = [
          ['detail', 'number', 4, 128],
          ['baseRadius', 'number', 0.5, 2.0],
          ['rippleDepth', 'number', 0.1, 1.5],
          ['sensitivity', 'number', 0.1, 3.0],
          ['rotationSpeed', 'number', 0.0, 5.0],
          ['audioSamples', 'number', 10, 128],
          ['primaryColor', 'string'],
          ['accentColor', 'string'],
          ['bgColor', 'string'],
        ];

        const colorRe = /^#[0-9a-fA-F]{6}$/;
        const errors: string[] = [];

        for (const [key, type, min, max] of schema) {
          const val = parsed[key];
          if (val === undefined) {
            errors.push(`Missing key: "${String(key)}"`);
            continue;
          }
          if (typeof val !== type) {
            errors.push(`Type error: "${String(key)}"`);
            continue;
          }
          if (type === 'number' && min !== undefined && max !== undefined) {
            if ((val as number) < min || (val as number) > max)
              errors.push(`Range error: "${String(key)}"`);
          }
          if (type === 'string' && !colorRe.test(val as string))
            errors.push(`Format error: "${String(key)}"`);
        }

        if (errors.length > 0) {
          console.error(
            '[Sonic Blob] Config upload failed:\n' + errors.join('\n'),
          );
          return;
        }

        store.replace(parsed as Config);
        console.info('[Sonic Blob] Config loaded successfully.');
      } catch {
        console.error('[Sonic Blob] Config upload failed: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  // The CSS transition classes mirror the old raw manual classList modification
  const panelClasses = `
    pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 
    rounded-2xl p-6 w-[320px] text-white flex-col gap-5 transform origin-bottom-left 
    transition-all duration-300
    ${isOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}
  `;

  return (
    <div id="controls-panel" className={panelClasses}>
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <h3 className="font-semibold text-lg">Appearance Config</h3>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white cursor-pointer transition-colors border-none bg-transparent p-0"
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <SliderRow
          label="Shape Smoothness"
          value={config.detail}
          min={4}
          max={128}
          step={4}
          isInt
          onChange={(v: number) => handleChange('detail', v)}
          title="Higher = smoother but higher CPU usage"
        />
        <SliderRow
          label="Blob Size"
          value={config.baseRadius}
          min={0.5}
          max={2.0}
          step={0.05}
          onChange={(v: number) => handleChange('baseRadius', v)}
          title="Adjusts the overall size of the visualization"
        />
        <SliderRow
          label="Spin Speed"
          value={config.rotationSpeed}
          min={0.0}
          max={5.0}
          step={0.1}
          onChange={(v: number) => handleChange('rotationSpeed', v)}
          title="Controls how quickly the blob rotates"
        />
        <SliderRow
          label="Reaction Size"
          value={config.rippleDepth}
          min={0.1}
          max={1.5}
          step={0.05}
          onChange={(v: number) => handleChange('rippleDepth', v)}
          title="Sets the maximum height of the audio bumps/ripples"
        />
        <SliderRow
          label="Audio Sensitivity"
          value={config.sensitivity}
          min={0.1}
          max={3.0}
          step={0.1}
          onChange={(v: number) => handleChange('sensitivity', v)}
          title="Makes the blob react more easily to quieter sounds"
        />
        <SliderRow
          label="Audio Complexity"
          value={config.audioSamples}
          min={10}
          max={128}
          step={1}
          isInt
          onChange={(v: number) => handleChange('audioSamples', v)}
          title="Number of frequencies captured"
        />

        <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">
            Color Palette
          </div>

          <div className="flex justify-between items-center text-sm font-medium text-white/90">
            <label>Blob Lighting</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                title="Primary Color"
                className="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform"
              />
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                title="Accent Color"
                className="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-medium text-white/90">
            <label>Background</label>
            <input
              type="color"
              value={config.bgColor}
              onChange={(e) => handleChange('bgColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={handleReset}
          className="w-full bg-white/10 border-none text-white cursor-pointer font-semibold py-2.5 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Reset Config
        </button>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleDownload}
          className="w-full bg-white/10 border-none text-white cursor-pointer font-semibold py-2.5 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
        <label className="w-full bg-white/10 border-none text-white cursor-pointer font-semibold py-2.5 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>
    </div>
  );
};

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  isInt?: boolean;
  title?: string;
  onChange: (value: number) => void;
}

const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  isInt = false,
  title,
  onChange,
}: SliderRowProps) => {
  return (
    <div className="flex flex-col gap-1.5" title={title}>
      <div className="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
        <label>{label}</label>
        <span>{isInt ? Math.round(value) : Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
