import { useLocalStorage } from "@uidotdev/usehooks";
import useAi from "../../hooks/ai";
import VoiceVisualizer from "../voice-visualizer";
import { useState } from "react";

const MessageInputs = () => {
  const ai = useAi();
  const [mode, setMode] = useLocalStorage("mode", "text");
  const [text, setText] = useState("");
  return (
    <div>
      <div className="bottom-4 left-1/2 z-10 fixed w-64 h-16 -translate-x-1/2">
        {mode === "voice" && (
          <VoiceVisualizer
            silentSeconds={1.5}
            dampingFactor={0.4} // Slower return to normal
            onText={(text, isSilence) => {
              const msg = text.trim();
              if (!isSilence && msg && !ai.isReceivingMessage) {
                ai.sendTextMessage(msg);
              }
            }}
          />
        )}
        {mode === "text" && (
          <textarea
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ai.sendTextMessage(text);
                setText("");
              }
            }}
            className="border-[#FFB380] border-2 bg-[#FFF5E6] p-2 rounded-md w-full h-full outline-none resize-none"
          />
        )}
      </div>
      <div className="group bottom-0 left-1/2 z-10 fixed flex justify-center w-32 h-6 -translate-x-1/2 select-none">
        <div
          onClick={() => setMode(mode === "voice" ? "text" : "voice")}
          className="-bottom-4 group-hover:bottom-1 hover:bottom-1 absolute flex justify-center gap-2 bg-[#FFB380] px-2 py-1 rounded-md w-24 text-sm text-white capitalize transition-all cursor-pointer"
        >
          {mode}
        </div>
      </div>
    </div>
  );
};

export default MessageInputs;
