import React, { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  silentSeconds?: number;
  onText?: (text: string, isSilence: boolean) => void;
  dampingFactor?: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    webkitAudioContext: any;
    SpeechRecognition: any;
  }
}

type SpeechRecognition = any;

const textTimeout = 2000;

const VoiceInput: React.FC<Props> = ({
  silentSeconds = 1.5,
  onText,
  dampingFactor = 0.15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const smoothVolumeRef = useRef(0);
  const [isMuted, setIsMuted] = useState(true);
  const [lastText, setLastText] = useState<string>("");
  const [showText, setShowText] = useState(false);

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const averageVolume =
      dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    const normalizedVolume = averageVolume / 255;

    smoothVolumeRef.current =
      smoothVolumeRef.current * (1 - dampingFactor) +
      normalizedVolume * dampingFactor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height / 2;
    const waveHeight = smoothVolumeRef.current * 50;

    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 10) {
      const y =
        centerY +
        Math.sin((x / canvas.width) * Math.PI * 2 + Date.now() * 0.005) *
          waveHeight;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${smoothVolumeRef.current * 360}, 70%, 60%)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    requestAnimationFrame(drawWaveform);
  }, [dampingFactor]);

  const startAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      microphone.connect(analyser);
      analyser.fftSize = 512;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;

      drawWaveform();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      onText?.("Microphone access required", true);
    }
  }, [drawWaveform, onText]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onText?.("Speech recognition not supported", true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setLastText(transcript);
      setShowText(true);
      setTimeout(() => setShowText(false), textTimeout);
      onText?.(transcript, false);
    };

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [onText]);

  const stopAll = useCallback(() => {
    recognitionRef.current?.stop();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    recognitionRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    microphoneRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      startAudio();
      startRecognition();
    } else {
      stopAll();
    }
    setIsMuted((prev) => !prev);
  }, [isMuted, startAudio, startRecognition, stopAll]);

  useEffect(() => {
    return stopAll;
  }, []);

  return (
    <div
      className="group cursor-pointer size-full"
      onClick={toggleMute}
      role="button"
      aria-label="Voice visualizer"
    >
      <canvas ref={canvasRef} className="size-full" />
      {isMuted && (
        <span className="top-1/2 left-1/2 absolute text-gray-400 text-sm -translate-x-1/2 -translate-y-1/2">
          Muted
        </span>
      )}
      {showText && (
        <div className="top-0 left-0 absolute w-full text-[#FFB380] text-center text-xl">
          {lastText}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
