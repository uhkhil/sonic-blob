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
    console.log(`[Audio] Initializing capture for tab: ${targetTabId}...`);

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
        console.log(
          `[Audio] Requesting fresh streamId (attempt ${attempts}/${MAX_RETRIES})...`,
        );
        const { streamId } = await chrome.runtime.sendMessage({
          type: 'GET_STREAM_ID',
          targetTabId,
        });

        if (!streamId) {
          throw new Error('Failed to acquire streamId from background script.');
        }

        console.log(
          `[Audio] Attempting userMedia capture with token: ${streamId.substring(0, 8)}...`,
        );

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
          console.log(
            '[Audio] Stream captured successfully on attempt',
            attempts,
            ':',
            stream.id,
          );
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
          console.log(`[Audio] Waiting ${RETRY_DELAY}ms before retry...`);
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
      console.log('[Audio] AudioContext is suspended, attempting to resume...');
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
      console.log('[Audio] Cleaning up audio capture...');
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
