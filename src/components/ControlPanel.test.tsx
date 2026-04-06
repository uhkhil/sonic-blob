/**
 * @file Unit tests for the ControlPanel component.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';
import { useStore } from '../store';
import { INITIAL_THEMES } from '../themes';

describe('ControlPanel', () => {
  beforeEach(() => {
    useStore.setState({
      activeThemeIndex: 0,
      themes: structuredClone(INITIAL_THEMES),
    });
  });

  it('renders initial slider values from the active theme', () => {
    render(<ControlPanel isOpen={true} onClose={() => {}} />);

    const initialThemeConfig = INITIAL_THEMES[0].config;

    // Grab the sensitivity slider by its accessible label
    const sensitivitySlider = screen.getByLabelText('Audio Sensitivity');
    expect(sensitivitySlider).toHaveValue(
      initialThemeConfig.sensitivity.toString(),
    );

    const baseRadiusSlider = screen.getByLabelText('Blob Size');
    expect(baseRadiusSlider).toHaveValue(
      initialThemeConfig.baseRadius.toString(),
    );
  });

  it('updates the store when a slider is changed', async () => {
    render(<ControlPanel isOpen={true} onClose={() => {}} />);
    const sensitivitySlider = screen.getByLabelText('Audio Sensitivity');

    // Simulate user changing the slider
    // Note: for range inputs, fireEvent.change is often needed instead of userEvent
    // due to how jsdom implements range input values.
    fireEvent.change(sensitivitySlider, { target: { value: '3.0' } }); // changed to perfectly matching snap value to avoid float issues, wait, 3.0 is max

    // Assert that the input visually updated
    expect(sensitivitySlider).toHaveValue('3');

    // Assert that store correctly captured the new configuration
    await waitFor(() => {
      const activeConfig = useStore.getState().themes[0].config;
      expect(activeConfig.sensitivity).toBe(3);
    });
  });

  it('updates the store when a color input is changed', async () => {
    render(<ControlPanel isOpen={true} onClose={() => {}} />);

    // Find the primary color input
    // In our component, we might have multiple labels for Primary Color ("Color", "Color", "Color").
    // But they have title attributes like 'Primary Color' or 'Accent Color'
    const primaryColorInput = screen.getByTitle('Primary Color');

    fireEvent.change(primaryColorInput, { target: { value: '#ff0000' } });

    await waitFor(() => {
      const activeConfig = useStore.getState().themes[0].config;
      expect(activeConfig.primaryColor).toBe('#ff0000');
    });
  });
});
