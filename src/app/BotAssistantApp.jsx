import React, { useCallback, useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { convertToInt16, resampleAudio } from "./utils/VoiceBot.utils";

const BotAssistantApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hoverAskBtn, setHoverAskBtn] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micDialogOpen, setMicDialogOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Timer refs
  const timerIntervalRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // Audio context refs
  const captureAudioContextRef = useRef(null);
  const playbackAudioContextRef = useRef(null);

  // Message refs
  const botMessageBufferRef = useRef([]);

  // WebSocket ref
  const websocketRef = useRef(null);

  // Audio processing refs
  const scriptProcessorRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const streamRef = useRef(null);
  const audioQueueTimeRef = useRef(0);

  // Voice activity detection refs
  const silenceThresholdRef = useRef(0.01);
  const silenceTimeoutRef = useRef(null);
  const speakingTimeoutRef = useRef(null);
  const consecutiveSilentFramesRef = useRef(0);
  const silenceFrameThresholdRef = useRef(10);

  // PCM audio playback refs
  const audioBufferQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef(null);
  const conversationContextRef = useRef(null);

  // Added based on JS implementation
  const sendBufferRef = useRef([]);
  const isProcessingRef = useRef(false);
  const recordedChunksRef = useRef([]);
  const bufferProcessIntervalRef = useRef(null);
  const istreamRef = useRef(false);

  const startTimer = () => {
    recordingStartTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsedTime = (Date.now() - recordingStartTimeRef.current) / 1000;
      setRecordingTime(elapsedTime);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  // Ensure audio context is initialized and resumed
  const ensureAudioContext = useCallback(() => {
    if (!playbackAudioContextRef.current) {
      playbackAudioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (playbackAudioContextRef.current.state === "suspended") {
      playbackAudioContextRef.current.resume().catch(console.error);
    }
  }, []);

  // Helper function for converting Float32Array to Int16Array (PCM format)
  const floatTo16BitPCM = useCallback((inputArray) => {
    const output = new Int16Array(inputArray.length);
    for (let i = 0; i < inputArray.length; i++) {
      const s = Math.max(-1, Math.min(1, inputArray[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }, []);

  // Process and send buffered audio data
  const processSendBuffer = useCallback(() => {
    if (sendBufferRef.current.length === 0 || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const toSend = sendBufferRef.current.shift();
      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.send(toSend);
      }
    } catch (error) {
      console.error("Error sending audio data:", error);
    } finally {
      isProcessingRef.current = false;

      // Continue processing if buffer still has items
      if (sendBufferRef.current.length > 0) {
        setTimeout(() => processSendBuffer(), 10);
      }
    }
  }, []);

  // Convert PCM16 to AudioBuffer
  const convertPCM16ToAudioBuffer = useCallback((arrayBuffer) => {
    const audioData = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(audioData.length);

    // Normalize PCM16 to Float32 (-32768 to 32767) -> (-1 to 1)
    for (let i = 0; i < audioData.length; i++) {
      float32Array[i] = Math.max(-1, Math.min(1, audioData[i] / 32768.0));
    }

    // Create buffer with correct sample rate
    const buffer = playbackAudioContextRef.current.createBuffer(
      1,
      float32Array.length,
      17000
    );
    buffer.copyToChannel(float32Array, 0);

    return buffer;
  }, []);

  // Process PCM16 audio data
  const processPCM16Audio = useCallback(
    (arrayBuffer) => {
      console.log("Received PCM16 data:", arrayBuffer.byteLength, "bytes");

      const audioBuffer = convertPCM16ToAudioBuffer(arrayBuffer);

      if (audioBuffer) {
        // Add to queue
        audioBufferQueueRef.current.push(audioBuffer);

        // Start playback if not already playing
        if (!isPlayingRef.current) {
          playBufferedAudio();
        }
      }
    },
    [convertPCM16ToAudioBuffer]
  );

  // Play buffered audio
  const playBufferedAudio = useCallback(() => {
    ensureAudioContext();

    if (audioBufferQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      console.log("Audio buffer is empty. No more audio to play.");

      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.send(
          JSON.stringify({ source: "interface", message: "ACK" })
        );
      }
      return;
    }

    let audioBuffer = audioBufferQueueRef.current.shift();
    if (!audioBuffer) {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      return;
    }

    isPlayingRef.current = true;

    // Create source node
    let source = playbackAudioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;

    // Create a gain node for muting the beginning (to prevent the "tuk" sound)
    const gainNode = playbackAudioContextRef.current.createGain();

    // Start with gain at 0 (muted)
    gainNode.gain.setValueAtTime(
      0,
      playbackAudioContextRef.current.currentTime
    );

    // After 30ms, ramp up to full volume over 10ms
    gainNode.gain.linearRampToValueAtTime(
      1.0,
      playbackAudioContextRef.current.currentTime + 0.04 // 40ms total: 30ms mute + 10ms ramp
    );

    // Connect through gain node instead of directly to destination
    source.connect(gainNode);
    gainNode.connect(playbackAudioContextRef.current.destination);

    // Store the current source for potential interruption
    currentSourceRef.current = source;

    // On playback end, play next chunk
    source.onended = function () {
      currentSourceRef.current = null;
      playBufferedAudio();
    };

    // Ensure AudioContext is running before starting
    if (playbackAudioContextRef.current.state === "suspended") {
      playbackAudioContextRef.current.resume().then(() => {
        source.start(0);
        console.log("Playing PCM16 audio chunk...");
      });
    } else {
      source.start(0);
      console.log("Playing PCM16 audio chunk...");
    }
  }, [ensureAudioContext]);

  // Handle audio stream data
  const handleAudioStream = useCallback(
    (data) => {
      if (!playbackAudioContextRef.current) {
        playbackAudioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      let interruptionData = { interruption: "" };

      if (typeof data === "string") {
        try {
          interruptionData = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing interruption data:", e);
        }
      }

      if (interruptionData.interruption === "detected") {
        isPlayingRef.current = false;
        console.log("Interruption detected: Pausing playback.");

        // Stop the currently playing audio
        if (currentSourceRef.current) {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop();
          currentSourceRef.current = null;
          console.log("Stopped current audio playback due to interruption.");
        }
        return;
      } else if (interruptionData.interruption === "true") {
        audioBufferQueueRef.current.length = 0; // Clear queue
        isPlayingRef.current = false;

        // Stop the currently playing audio
        if (currentSourceRef.current) {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop();
          currentSourceRef.current = null;
          console.log("Stopped current audio playback and cleared queue.");
        }
        return;
      } else if (interruptionData.interruption === "false") {
        console.log(
          "Interruption false: Ready to resume playback when data arrives."
        );
        isPlayingRef.current = false; // Don't immediately play, wait for new data
      }

      ensureAudioContext();

      if (data instanceof Blob) {
        data
          .arrayBuffer()
          .then((arrayBuffer) => processPCM16Audio(arrayBuffer))
          .catch((err) =>
            console.error("Error converting Blob to ArrayBuffer:", err)
          );
      } else if (data instanceof ArrayBuffer) {
        processPCM16Audio(data);
      } else {
        console.error("Received unknown data type:", typeof data, data);
      }
    },
    [ensureAudioContext, processPCM16Audio]
  );

  function mergeBotMessages(message) {
    if (message.length === 0) {
      return { type: "bot", text: "", timestamp: new Date() };
    }

    let mergedText = "";
    let lastTimestamp = message[0].timestamp;

    message?.forEach((msg) => {
      mergedText += msg?.text;
      lastTimestamp = msg?.timestamp;
    });

    return { type: "bot", text: mergedText, timestamp: lastTimestamp };
  }

  const stopAllAudio = useCallback(() => {
    // Stop PCM audio playback
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }

    // Clear buffer queue
    audioBufferQueueRef.current = [];
    isPlayingRef.current = false;

    // Reset the queue time
    if (playbackAudioContextRef.current) {
      audioQueueTimeRef.current = playbackAudioContextRef.current.currentTime;
    }
  }, []);

  const handleInterruption = useCallback(
    (type) => {
      if (!playbackAudioContextRef.current) return;

      console.log(`Interruption: ${type}`);

      if (type === "detected") {
        // Just pause the context
        playbackAudioContextRef.current.suspend();

        // Also handle PCM audio interruption
        isPlayingRef.current = false;
        if (currentSourceRef.current) {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop();
          currentSourceRef.current = null;
        }
      } else if (type === "true") {
        // Stop all audio and clear queues
        stopAllAudio();
        audioBufferQueueRef.current = [];

        // Close and recreate audio context
        if (playbackAudioContextRef.current) {
          playbackAudioContextRef.current
            .close()
            .then(() => {
              playbackAudioContextRef.current = new (window.AudioContext ||
                window.webkitAudioContext)();
              audioQueueTimeRef.current =
                playbackAudioContextRef.current.currentTime;
            })
            .catch(console.error);
        }
      } else if (type === "false") {
        // Resume playback
        if (playbackAudioContextRef.current.state === "suspended") {
          playbackAudioContextRef.current.resume();
        }
        // Don't start PCM playback until new data arrives
        isPlayingRef.current = false;
      } else if (type === "END") {
        // Wait for all audio to finish playing before sending ACK
        const checkFinished = () => {
          const pcmFinished =
            !isPlayingRef.current && audioBufferQueueRef.current.length === 0;

          if (pcmFinished) {
            if (
              websocketRef.current &&
              websocketRef.current.readyState === WebSocket.OPEN
            ) {
              const payload = JSON.stringify({
                source: "interface",
                message: "ACK",
              });
              websocketRef.current.send(payload);
              console.log("Sent ACK after audio completion");
            }
          } else {
            // Check again after a short delay
            setTimeout(checkFinished, 100);
          }
        };

        checkFinished();
      }
    },
    [stopAllAudio]
  );

  // Modified startAudioStream function with the JS implementation logic
  const startAudioStream = useCallback(async () => {
    try {
      console.log("Stream start");

      // Reset buffers
      sendBufferRef.current = [];
      recordedChunksRef.current = [];
      istreamRef.current = false;

      const audioTrackConstraints = {
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
        channelCount: 1, // Force mono audio to avoid echo issues
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioTrackConstraints,
      });
      console.log("🎤 Microphone stream:", stream);
      streamRef.current = stream;

      // Ensure WebSocket is open
      if (
        !websocketRef.current ||
        websocketRef.current.readyState !== WebSocket.OPEN
      ) {
        console.warn("⚠️ Audio WebSocket not ready. Retrying...");
        setTimeout(() => startAudioStream(), 1000);
        return;
      }

      console.log("Stream start 1");

      // ✅ Ensure AudioContext is initialized with correct sample rate
      if (!captureAudioContextRef.current) {
        console.log("Stream start 1.1");
        captureAudioContextRef.current = new AudioContext({ sampleRate: 8000 });
      }

      if (captureAudioContextRef.current.state === "suspended") {
        console.log(
          "Stream start 1.2 - Before resume, state:",
          captureAudioContextRef.current.state
        );

        try {
          await captureAudioContextRef.current.resume();
          console.log("🔊 AudioContext resumed successfully.");
        } catch (error) {
          console.error("❌ Error resuming AudioContext:", error);
        }

        console.log(
          "Stream start 1.2 - After resume, state:",
          captureAudioContextRef.current.state
        );
      }

      // Create audio processing pipeline
      mediaStreamSourceRef.current =
        captureAudioContextRef.current.createMediaStreamSource(stream);
      scriptProcessorRef.current =
        captureAudioContextRef.current.createScriptProcessor(1024, 1, 1);
      mediaStreamSourceRef.current.connect(scriptProcessorRef.current);

      // Create a silent destination node to prevent feedback
      const silentDestination = captureAudioContextRef.current.createGain();
      silentDestination.gain.value = 0;
      scriptProcessorRef.current.connect(silentDestination);
      silentDestination.connect(captureAudioContextRef.current.destination);

      // Set up a timer to process the buffer
      bufferProcessIntervalRef.current = setInterval(
        () => processSendBuffer(),
        100
      );

      // IMPORTANT: Maintain the original delay mechanism!
      istreamRef.current = false;
      setTimeout(() => {
        console.log("🕒 Delay completed, now streaming audio data.");
        istreamRef.current = true;
      }, 6000); // Keep the original 8-second delay

      scriptProcessorRef.current.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        if (inputBuffer.length === 0) {
          console.warn("⚠️ No audio data captured.");
          return;
        }

        const pcmData = floatTo16BitPCM(inputBuffer);
        const chunkToSend = new Int16Array(pcmData);
        const byteArray = new Uint8Array(chunkToSend.buffer);
        const base64Data = btoa(String.fromCharCode(...byteArray));

        // Store raw audio data for download functionality if recording is enabled
        if (isRecording) {
          recordedChunksRef.current.push(new Float32Array(inputBuffer));
        }

        // Use the original delay logic
        if (!istreamRef.current) {
          // Still in delay period, don't send audio yet
          return;
        } else {
          const jsonData = JSON.stringify({
            source: "client",
            audio: base64Data,
          });

          // Add to send buffer instead of sending directly
          sendBufferRef.current.push(jsonData);

          // Trigger buffer processing
          if (!isProcessingRef.current) {
            processSendBuffer();
          }
        }
      };

      setIsListening(true);
      console.log("🎤 Audio streaming started with 8-second delay...");

      // Initialize the audio queue time with a small offset to prevent immediate playback
      if (playbackAudioContextRef.current) {
        // Ensure playback context is in running state
        if (playbackAudioContextRef.current.state !== "running") {
          await playbackAudioContextRef.current.resume();
        }
        audioQueueTimeRef.current =
          playbackAudioContextRef.current.currentTime + 0.1; // Add 100ms buffer
      }
    } catch (error) {
      console.error("Error setting up audio stream:", error);
      throw error;
    }
  }, [floatTo16BitPCM, processSendBuffer]);

  const cleanup = useCallback(async () => {
    // Clear the buffer process interval
    if (bufferProcessIntervalRef.current) {
      clearInterval(bufferProcessIntervalRef.current);
      bufferProcessIntervalRef.current = null;
    }

    // Clear VAD timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    setIsSpeaking(false);
    setIsListening(false);

    // Stop audio playback
    stopAllAudio();

    // Reset PCM audio state
    audioBufferQueueRef.current = [];
    isPlayingRef.current = false;

    // Reset other buffers
    sendBufferRef.current = [];
    recordedChunksRef.current = [];
    istreamRef.current = false;
    isProcessingRef.current = false;

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }

    // Close audio contexts
    if (captureAudioContextRef.current) {
      await captureAudioContextRef.current.close().catch(console.error);
      captureAudioContextRef.current = null;
    }

    if (playbackAudioContextRef.current) {
      await playbackAudioContextRef.current.close().catch(console.error);
      playbackAudioContextRef.current = null;
    }

    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close(1000, "Normal closure");
      websocketRef.current = null;
    }

    // Reset audio queue
    audioQueueTimeRef.current = 0;
  }, [stopAllAudio]);

  const handleOpenMicDialog = () => {
    setMicDialogOpen(true);
  };

  const handleCloseMicDialog = () => {
    setMicDialogOpen(false);
  };

  const handleStartRecordingWithContext = async () => {
    try {
      await cleanup();
      await connectWebSocket(conversationContextRef.current);
      await startAudioStream();
      setIsRecording(true);
      startTimer();
      handleCloseMicDialog();
    } catch (error) {
      console.error("Error starting recording with context:", error);
      await cleanup();
      stopTimer();
    }
  };

  const connectWebSocket = useCallback(() => {
    return new Promise((resolve, reject) => {
      const url =
        // "wss://conv-bot.infra.kapturecrm.com/orchestrator_reliance/ws";
        // const url = "wss://vb-platform.infra.kapturecrm.com/orchestrator/ws"
        "wss://happy-topical-jaybird.ngrok-free.app/orchestrator_reliance/ws";
      // "wss://bbchat.infra.kapturecrm.com/orchestrator_reliance/ws"

      websocketRef.current = new WebSocket(url);

      websocketRef.current.onopen = () => {
        const initialMessage = {
          source: "client",
          audio: "",
          client_id: "adani",
          // user_code: "E800A8184E1",
        };

        websocketRef.current.send(JSON.stringify(initialMessage));

        resolve(websocketRef.current);
      };

      websocketRef.current.onmessage = (event) => {
        try {
          // Handle Blob data (audio)
          if (event.data instanceof Blob) {
            // Process with the new PCM audio handler
            handleAudioStream(event.data);
            return;
          }

          const data = JSON.parse(event.data);

          if (data?.interruption) {
            handleInterruption(data.interruption);
            return;
          }

          if (data?.source === "transcriber" && typeof data.text === "string") {
            setIsProcessing(true);
            setMessages((prev) => [
              ...prev,
              {
                type: "user",
                text: data.text,
                timestamp: new Date(),
              },
            ]);
            // setIsTyping(true);
          } else if (data?.source === "llm" && typeof data.text === "string") {
            if (data.text === "END") {
              setIsTyping(false);
              const mergedMessage = mergeBotMessages(
                botMessageBufferRef.current
              );
              setMessages((prev) => [...prev, mergedMessage]);
              botMessageBufferRef.current = [];
            } else if (typeof data.text === "string") {
              setIsProcessing(false);

              setMessages((prev) => [
                ...prev,
                {
                  type: "bot",
                  text: data.text,
                  timestamp: new Date(),
                },
              ]);
              //   botMessageBufferRef.current.push({

              //   });
            }
          }
        } catch (error) {
          console.error("Error handling message:", error);
        }
      };

      websocketRef.current.onclose = (event) => {
        console.log("WebSocket connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setIsRecording(false);
        setIsSpeaking(false);
      };

      websocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }, [handleInterruption, handleAudioStream]);

  const handleRecordingButton = async () => {
    if (!isRecording) {
      try {
        await cleanup();
        await connectWebSocket();
        await startAudioStream();
        setIsRecording(true);
        startTimer();
      } catch (error) {
        console.error("Error starting recording:", error);
        await cleanup();
        stopTimer();
      }
    } else {
      setIsRecording(false);
      setTranscripts([]);
      setInterimTranscript("");
      stopTimer();
      await cleanup();
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
      stopTimer();
    };
  }, [cleanup]);

  const handleReset = () => {
    setMessages([]);
  };

  // Function to handle voice input
  const handleVoiceInput = () => {
    handleRecordingButton();
  };

  return (
    <>
      <MessageBubble messages={messages} isProcessing={isProcessing} />
      <MessageInput
        isListening={isRecording}
        handleVoiceInput={handleVoiceInput}
        isSpeaking={isSpeaking}
      />
    </>
  );
};

export default BotAssistantApp;
