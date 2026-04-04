/**
 * @fileoverview Audio processing module for the Sonic Blob Chrome Extension.
 *
 * This file is responsible for capturing audio streams using tab media capture
 * (via stream ID tokens from the background script) and analyzing the frequency data
 * using the Web Audio API to drive visualizer animations.
 */

/**
 * Retrieves the target tab ID from the current URL.
 *
 * @returns The parsed target tab ID.
 * @throws If `targetTabId` is missing from the query parameters.
 */
function getTargetTabId(): number {
  const urlParams = new URLSearchParams(window.location.search);
  const targetTabIdStr = urlParams.get('targetTabId');

  if (!targetTabIdStr) {
    throw new Error(
      'No targetTabId found in URL. Extension must be invoked via the action button.',
    );
  }

  return parseInt(targetTabIdStr, 10);
}

/**
 * Communicates with the background script to acquire a stream token and
 * resolves it into a MediaStream for tab audio capture.
 * Automatically retries up to 3 times on failure.
 *
 * @param targetTabId - The ID of the tab to capture.
 * @returns A promise resolving to the captured MediaStream.
 */
async function getAudioStream(targetTabId: number): Promise<MediaStream> {
  const INITIAL_DELAY = 500;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 500;

  await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY));

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      attempts++;

      // Request a FRESH streamId token for every attempt,
      // as they are single-use and expire if capture fails.
      const { streamId } = await chrome.runtime.sendMessage({
        type: 'GET_STREAM_ID',
        targetTabId,
      });

      if (!streamId) {
        throw new Error('Failed to acquire streamId from background script.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId,
          },
        } as unknown as MediaTrackConstraints,
        video: false,
      });

      if (stream) {
        return stream;
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[Audio] Capture failed on attempt ${attempts}:`,
        err.name,
        err.message,
      );
      if (attempts < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    'Failed to capture audio stream from tab after multiple attempts.',
  );
}

/**
 * Initializes the Web Audio API context, connects the stream to an analyzer,
 * and sets up a continuous sampling loop.
 *
 * @param stream - The captured MediaStream.
 * @param onData - The callback receiving the frequency data.
 * @returns A promise resolving to a cleanup function.
 */
async function setupAudioAnalysis(
  stream: MediaStream,
  onData: (data: Uint8Array) => void,
): Promise<() => void> {
  const audioCtx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();

  analyser.fftSize = 256;
  source.connect(analyser);

  // To allow the audio to continue playing to the user, we connect the source to the destination.
  source.connect(audioCtx.destination);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const updateData = () => {
    // If the stream ends, stop updating
    if (stream && stream.active) {
      requestAnimationFrame(updateData);
      analyser.getByteFrequencyData(dataArray);
      onData(dataArray);
    }
  };

  updateData();

  return () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    audioCtx.close();
  };
}

/**
 * Initializes the audio capture from the active tab and sets up an AnalyserNode.
 * It constantly calls `requestAnimationFrame` to sample frequency data, which is
 * fed back to the provided `onData` callback.
 *
 * @param onData - A callback function that receives the raw frequency data array.
 * @returns A promise that resolves to a cleanup function to stop capture and close the context.
 * @throws Will throw an error if the URL doesn't contain a `targetTabId` or if capture fails.
 */
export async function startAudioCapture(
  onData: (data: Uint8Array) => void,
): Promise<() => void> {
  try {
    const targetTabId = getTargetTabId();
    const stream = await getAudioStream(targetTabId);
    return await setupAudioAnalysis(stream, onData);
  } catch (error) {
    console.error('[Audio] Final error starting audio capture:', error);
    if (error instanceof Error) {
      console.error('[Audio] Error details:', error.name, '-', error.message);
    }
    throw error;
  }
}

/**
 * Calculates the average intensity of a specific frequency range.
 *
 * @param data - The frequency array.
 * @param startIdx - The starting index (inclusive).
 * @param endIdx - The ending index (exclusive).
 * @returns The normalized average value between 0.0 and 1.0.
 */
function calculateAverageIntensity(
  data: Uint8Array,
  startIdx: number,
  endIdx: number,
): number {
  if (endIdx <= startIdx || data.length === 0) return 0;

  let sum = 0;
  for (let i = startIdx; i < endIdx; i++) {
    sum += data[i];
  }
  const count = endIdx - startIdx;
  return sum / count / 255.0;
}

/**
 * Analyzes the raw frequency data to calculate normalized volume, bass, and treble values.
 *
 * Uses the frequency bins from the AnalyserNode to estimate the intensity of different
 * frequency ranges. Values are normalized to a range of 0.0 to 1.0 based on generic
 * audio approximations for visual reactivity.
 *
 * @param audioData - The raw frequency data array.
 * @param audioSamples - The number of frequency bins to compute.
 * @returns An object containing normalized `currentVolume`, `currentBass`, and `currentTreble`.
 */
export function analyzeFrequencyData(
  audioData: Uint8Array | null,
  audioSamples: number,
): { currentVolume: number; currentBass: number; currentTreble: number } {
  let currentVolume = 0;
  let currentBass = 0;
  let currentTreble = 0;

  if (audioData && audioData.length > 0) {
    const captureLen = Math.floor(audioSamples);
    const actualLen = Math.min(captureLen, audioData.length);

    if (actualLen > 0) {
      // 1. Calculate Overall Volume (Average of all captured frequencies)
      currentVolume = calculateAverageIntensity(audioData, 0, actualLen);

      // 2. Calculate Bass (Average of the lower 10% of frequency bins)
      const bassEnd = Math.max(1, Math.floor(actualLen * 0.1));
      currentBass = calculateAverageIntensity(audioData, 0, bassEnd);

      // 3. Calculate Treble (Average of the upper 60% of frequency bins)
      const trebleStart = Math.min(actualLen - 1, Math.floor(actualLen * 0.4));
      currentTreble = calculateAverageIntensity(
        audioData,
        trebleStart,
        actualLen,
      );
    }
  }

  return { currentVolume, currentBass, currentTreble };
}
