import { useEffect, useRef, useState } from "react";
import { KokoroTTS } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-ONNX";

const VoicePlayer = () => {
  const ttsRef = useRef<KokoroTTS>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    KokoroTTS.from_pretrained(model_id, {
      dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
    }).then((tts) => {
      ttsRef.current = tts;
      setLoaded(true);
    });
  }, []);
  const generate = (text: string) => {
    if (!ttsRef.current || !loaded) return;
    console.log(`Generating voice for: ${text}`);

    ttsRef.current
      .generate(text, {
        // Use `tts.list_voices()` to list all available voices
        voice: "af_bella",
      })
      .then(async (audio) => {
        const blob = await audio.toBlob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.play();
      });
  };
  return (
    <div className="z-20 flex flex-col gap-2">
      <div>status: {loaded ? "loaded" : "loading"}</div>
      <button
        onClick={() =>
          generate(
            "Some people choose to see the ugliness in this world, the disarray. I choose to see the beauty."
          )
        }
      >
        Play
      </button>
    </div>
  );
};

export default VoicePlayer;
