/**
 * @file Control panel for adjusting the blob's appearance and behavior.
 */
import React, { useState, useEffect, useRef } from 'react';
import { store } from '../store';
import type { StoreState } from '../store';
import type { Config } from '../store';
import { CloseIcon, ResetIcon } from './Icons';

/**
 * A floating control panel that allows users to tweak visualizer configuration options.
 */
export const ControlPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<StoreState>(store.currentState);
  const config = state.themes[state.activeThemeIndex].config;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleChange = (
    key: keyof Config,
    value: number | string | boolean,
  ) => {
    store.update({ [key]: value });
  };

  const handleReset = () => {
    store.reset();
  };

  // The CSS transition classes mirror the old raw manual classList modification
  const panelClasses = `
    pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 
    rounded-2xl p-6 w-[320px] text-white flex-col gap-5 transform origin-bottom-left 
    transition-all duration-300
    ${isOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}
  `;

  return (
    <div ref={panelRef} id="controls-panel" className={panelClasses}>
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <h3 className="font-semibold text-lg">Appearance Config</h3>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white cursor-pointer transition-colors border-none bg-transparent p-0"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <SliderRow
          label="Shape Smoothness"
          value={config.detail}
          min={1}
          max={240}
          step={1}
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
        <ToggleRow
          label="Move Together"
          value={config.moveTogether}
          onChange={(v: boolean) => handleChange('moveTogether', v)}
          title="Toggle whether the whole blob wobbles together or ripples individually"
        />
        <SliderRow
          label="Finish (Glossy to Matte)"
          value={config.roughness}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={(v: number) => handleChange('roughness', v)}
          title="Adjusts the finish from glossy (0.0) to matte (1.0)"
        />
        <SliderRow
          label="Transparency"
          value={1.0 - config.opacity}
          min={0.0}
          max={1.0}
          step={0.05}
          onChange={(v: number) => handleChange('opacity', 1.0 - v)}
          title="Adjusts visibility from opaque (left) to transparent (right)"
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
          <ResetIcon />
          Reset Config
        </button>
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

interface ToggleRowProps {
  label: string;
  value: boolean;
  title?: string;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ label, value, title, onChange }: ToggleRowProps) => {
  return (
    <div className="flex justify-between items-center" title={title}>
      <label className="text-xs font-medium text-white/70 uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 border-none cursor-pointer ${
          value ? 'bg-[#73b2c1]' : 'bg-white/20'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
            value ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

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
