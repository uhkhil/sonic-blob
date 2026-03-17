export async function startAudioCapture(onData: (data: Uint8Array) => void) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const streamId = urlParams.get('streamId');

    if (!streamId) {
      throw new Error("No streamId found in URL. Extension must be invoked via the action button.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } as any,
      video: false
    });

    if (!stream) {
      throw new Error("Failed to capture audio stream from tab.");
    }

    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);

    // To allow the audio to continue playing to the user, we connect the source to the destination.
    // However, in a Chrome extension popup for tabCapture, the audio is routed to the extension.
    // If we don't route it back to the destination, the tab might go silent.
    source.connect(audioCtx.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateData = () => {
      // If the stream ends, stop updating
      if (stream.active) {
        requestAnimationFrame(updateData);
        analyser.getByteFrequencyData(dataArray);
        onData(dataArray);
      }
    };

    updateData();

    return () => {
      stream.getTracks().forEach((track) => track.stop());
      audioCtx.close();
    };
  } catch (error) {
    console.error("Error starting audio capture:", error);
    throw error;
  }
}
