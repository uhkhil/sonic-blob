export async function startAudioCapture(onData: (data: Uint8Array) => void) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTabIdStr = urlParams.get('targetTabId');

    if (!targetTabIdStr) {
      throw new Error(
        'No targetTabId found in URL. Extension must be invoked via the action button.',
      );
    }

    const targetTabId = parseInt(targetTabIdStr, 10);

    const INITIAL_DELAY = 500;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY));

    let stream: MediaStream | null = null;
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

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: streamId,
            },
          } as unknown as MediaTrackConstraints,
          video: false,
        });

        if (stream) {
          break;
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

    if (!stream) {
      throw new Error(
        'Failed to capture audio stream from tab after multiple attempts.',
      );
    }

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
  } catch (error) {
    console.error('[Audio] Final error starting audio capture:', error);
    if (error instanceof Error) {
      console.error('[Audio] Error details:', error.name, '-', error.message);
    }
    throw error;
  }
}

/**
 * Audio Analysis Helper
 * Takes raw frequency data from the microphone and calculates three values:
 * - currentVolume: Overall loudness
 * - currentBass: Low frequency bumps
 * - currentTreble: High frequency sounds
 *
 * These values are normalized between 0.0 and 1.0.
 */
export function analyzeFrequencyData(
  audioData: Uint8Array | null,
  audioSamples: number,
) {
  let currentVolume = 0;
  let currentBass = 0;
  let currentTreble = 0;

  if (audioData && audioData.length > 0) {
    const captureLen = Math.floor(audioSamples);
    const actualLen = Math.min(captureLen, audioData.length);

    if (actualLen > 0) {
      // 1. Calculate Overall Volume (Average of all captured frequencies)
      let volSum = 0;
      for (let i = 0; i < actualLen; i++) {
        volSum += audioData[i];
      }
      currentVolume = volSum / actualLen / 255.0; // 255 is the max byte value

      // 2. Calculate Bass (Average of the lower 10% of frequency bins)
      const bassEnd = Math.max(1, Math.floor(actualLen * 0.1));
      let bassSum = 0;
      for (let i = 0; i < bassEnd; i++) {
        bassSum += audioData[i];
      }
      currentBass = bassSum / bassEnd / 255.0;

      // 3. Calculate Treble (Average of the upper 60% of frequency bins)
      const trebleStart = Math.min(actualLen - 1, Math.floor(actualLen * 0.4));
      const trebleCount = actualLen - trebleStart;
      let trebleSum = 0;
      if (trebleCount > 0) {
        for (let i = trebleStart; i < actualLen; i++) {
          trebleSum += audioData[i];
        }
        currentTreble = trebleSum / trebleCount / 255.0;
      }
    }
  }

  return { currentVolume, currentBass, currentTreble };
}
