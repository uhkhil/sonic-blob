/**
 * @file Unit tests for the audio processing module
 */
import { describe, it, expect } from 'vitest';
import { analyzeFrequencyData } from './audio';

describe('analyzeFrequencyData', () => {
  it('handles null or empty input safely', () => {
    const resultNull = analyzeFrequencyData(null, 128);
    expect(resultNull).toEqual({
      currentVolume: 0,
      currentBass: 0,
      currentTreble: 0,
    });

    const resultEmpty = analyzeFrequencyData(new Uint8Array(0), 128);
    expect(resultEmpty).toEqual({
      currentVolume: 0,
      currentBass: 0,
      currentTreble: 0,
    });
  });

  it('calculates expected metrics for a uniform frequency array', () => {
    const data = new Uint8Array(10);
    data.fill(255); // max intensity across all 10 bins
    // Volume: average of all 10
    // Bass: average of lower 10% (first 1 bin, idx 0) => 255
    // Treble: average of upper 60% (last 6 bins, idx 4 to 10) => 255

    const result = analyzeFrequencyData(data, 10);

    // 255 / 255 = 1.0 expected
    expect(result.currentVolume).toBeCloseTo(1.0);
    expect(result.currentBass).toBeCloseTo(1.0);
    expect(result.currentTreble).toBeCloseTo(1.0);
  });

  it('calculates high bass accurately', () => {
    const data = new Uint8Array(100);
    // Fill the bass region (bottom 10%, indices 0-9) with high values (255)
    for (let i = 0; i < 10; i++) {
      data[i] = 255;
    }
    // Middle region with some noise (128)
    for (let i = 10; i < 40; i++) {
      data[i] = 127; // approx 0.5
    }
    // Treble region empty (0)
    for (let i = 40; i < 100; i++) {
      data[i] = 0;
    }

    const result = analyzeFrequencyData(data, 100);

    // Bass should be exactly 1.0 because indices 0-9 are 255
    expect(result.currentBass).toBeCloseTo(1.0);

    // Treble should be exactly 0.0 because indices 40-99 are 0
    expect(result.currentTreble).toBeCloseTo(0.0);

    // Volume will be roughly: (10*255 + 30*127 + 60*0) / 100 / 255 ≈ 0.249
    expect(result.currentVolume).toBeGreaterThan(0.2);
    expect(result.currentVolume).toBeLessThan(0.3);
  });

  it('truncates actual processing length based on audioSamples parameter', () => {
    // 100 elements array
    const data = new Uint8Array(100);
    data.fill(127); // approx 0.5 intensity everywhere

    // We pass audioSamples = 10, meaning only the first 10 elements are processed
    // Bass: lower 10% of actualLen (actualLen is 10, so 1 bin) = 127
    // Treble: idx 4 to 10 = 127
    // We can't tell the difference by value, but let's change elements past 10
    for (let i = 10; i < 100; i++) {
      data[i] = 255;
    }

    const result = analyzeFrequencyData(data, 10);

    // Because it only checks the first 10 elements which are 127
    // Expect all metrics to be 127/255 ≈ 0.498
    expect(result.currentVolume).toBeCloseTo(127 / 255);
    expect(result.currentBass).toBeCloseTo(127 / 255);
    expect(result.currentTreble).toBeCloseTo(127 / 255);
  });
});
