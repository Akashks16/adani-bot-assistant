export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return null;
};

export const resampleAudio = (audioData, fromSampleRate, toSampleRate) => {
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const resampledData = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    // Calculate exact position
    const exactPosition = i * ratio;

    // Get the two closest samples
    const indexLow = Math.floor(exactPosition);
    const indexHigh = Math.min(indexLow + 1, audioData.length - 1);

    // Calculate interpolation factor
    const fraction = exactPosition - indexLow;

    // Linear interpolation
    resampledData[i] =
      audioData[indexLow] * (1 - fraction) + audioData[indexHigh] * fraction;
  }

  return resampledData;
};

export const convertToInt16 = (float32Array) => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    int16Array[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
  }
  return int16Array;
};

export const floatTo16BitPCM = (input) => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
};

export const int16ToFloat32 = (input) => {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] / 0x7fff;
  }
  return output;
};

export const detectAudioFormat = (bytes) => {
  // Check for WAV header (RIFF)
  if (
    bytes[0] === 82 &&
    bytes[1] === 73 &&
    bytes[2] === 70 &&
    bytes[3] === 70
  ) {
    return "WAV";
  }

  // Check for MP3 header (ID3 or MPEG frame sync)
  if (
    (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) || // ID3v2
    // eslint-disable-next-line no-bitwise
    (bytes[0] === 255 && (bytes[1] & 0xe0) === 0xe0)
  ) {
    // MPEG frame sync
    return "MP3";
  }

  // Check for AAC/M4A
  if (
    bytes[4] === 102 &&
    bytes[5] === 116 &&
    bytes[6] === 121 &&
    bytes[7] === 112
  ) {
    return "AAC/M4A";
  }

  // Check for Ogg (for Opus, Vorbis)
  if (
    bytes[0] === 79 &&
    bytes[1] === 103 &&
    bytes[2] === 103 &&
    bytes[3] === 83
  ) {
    return "OGG";
  }

  // Unknown format
  return "Unknown";
};
