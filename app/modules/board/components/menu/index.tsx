import { useState, useRef, useEffect } from "react";
import { getBoardStore, useReactiveBoardStore } from "../../hooks/board.store";
import { Popover } from "react-tiny-popover";
import { useReactiveGlobalStore } from "../../hooks/global.store";
import { Link, useNavigate } from "react-router";

const Menu = () => {
  const { config } = useReactiveBoardStore();
  const globalStore = useReactiveGlobalStore();
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
  useEffect(() => {
    if (config.title) {
      document.title = config.title;
    }
  }, [config.title]);

  useEffect(() => {
    // on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditing(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const updateTitle = (value: string) => {
    config.title = value;
    const chat = globalStore.chats.find((chat) => chat.id === config.id);
    if (chat) {
      chat.title = value;
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end of input
      const value = inputRef.current.value;
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, [isEditing]);

  const chats = [...globalStore.chats].reverse();

  return (
    <div className="top-2 left-2 z-10 fixed flex flex-col gap-1 bg-[#FFF5E6] px-2 border border-[#ffc885]/70 rounded-md">
      <div className="flex gap-1">
        <Link to={"/"}>
          <h2 className={`text-[#FF7777] text-md cursor-pointer select-none`}>
            Vis board/
          </h2>
        </Link>

        <input
          ref={inputRef}
          className={`text-[#FF7777]/90 max-w-32 outline-hidden bg-[#FFF5E6] ${
            isEditing ? "font-semibold" : ""
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
    </div>
  );
};

export default Menu;
