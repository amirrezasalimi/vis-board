import { useState, useRef, useEffect } from "react";
import {
  useReactiveBoardStore,
  useBoardStore,
  useBoardSyncedState,
} from "../../hooks/board.store";

const Title = () => {
  const { config } = useReactiveBoardStore();
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const updateTitle = (value: string) => {
    config.title = value;
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end of input
      const value = inputRef.current.value;
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, [isEditing]);

  return (
    <div className="top-2 left-2 z-10 fixed flex gap-1">
      <h2 className="text-[#FF7777] text-md">Vis board/</h2>
      <input
        ref={inputRef}
        className={`opacity-80 text-[#FF7777] bg-transparent outline-none ${
          isEditing ? "outline outline-1 outline-[#FF7777] rounded-sm" : ""
        }`}
        value={config.title || "Untitled"}
        onChange={(e) => updateTitle(e.target.value)}
        onClick={() => {
          setIsEditing(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={!isEditing}
      />
    </div>
  );
};

export default Title;
