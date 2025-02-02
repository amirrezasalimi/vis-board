import { useState, useRef, useEffect } from "react";
import { getBoardStore, useReactiveBoardStore } from "../../hooks/board.store";
import { Popover } from "react-tiny-popover";
import { useReactiveGlobalStore } from "../../hooks/global.store";
import { useNavigate } from "react-router";

const Menu = () => {
  const { config } = useReactiveBoardStore();
  const globalStore = useReactiveGlobalStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };
  const removeChat = (id: string) => {
    const index = globalStore.chats.findIndex((chat) => chat.id === id);
    if (index !== -1) {
      // clear data
      globalStore.chats.splice(index, 1);
      const boardStore = getBoardStore(id);
      boardStore.persistence?.clearData();
    }
    // old chats
    const lastChat = globalStore.chats[globalStore.chats.length - 1];
    if (lastChat) {
      document.location.href = `/board/${lastChat.id}`;
    } else {
      document.location.href = "/";
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
        setIsMenuOpen(false);
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
    <div className="top-2 left-2 z-10 fixed flex flex-col gap-1 border-[#ffc885]/70 bg-[#FFF5E6] px-2 border rounded-md">
      <div className="flex gap-1">
        <Popover
          isOpen={isMenuOpen}
          // onClickOutside={() => setIsMenuOpen(false)}
          positions={"bottom"}
          content={
            <div className="flex flex-col justify-between border-[#ffc885] bg-[#ffefd8] mx-2 mt-1 p-1 border rounded-md w-[200px] h-[60dvh]">
              <div>
                <h2>Recent</h2>
                {chats.map((chat) => (
                  <div
                    onClick={() => {
                      document.location.href = `/board/${chat.id}`;
                    }}
                    key={chat.id}
                    className="group flex justify-between items-center hover:bg-[#ffc885] px-2 py-1 rounded-md cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <div className="bg-[#FF7777] rounded-full w-1 h-1"></div>
                      <span>{chat.title}</span>
                    </div>
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeChat(chat.id);
                      }}
                      className="group-hover:block border-[#FF7777] hidden bg-[#FFF5E6] hover:bg-[#ffefd8] px-2 border rounded-md text-[#FF7777]"
                    >
                      x
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <button
                  onClick={() => {
                    nav("/");
                  }}
                  className="border-[#ffc885] hover:bg-[#ffefd8] px-2 py-1 border rounded-md w-full text-sm"
                >
                  New
                </button>
              </div>
            </div>
          }
        >
          <h2
            className={`text-[#FF7777] text-md cursor-pointer select-none ${
              isMenuOpen ? "underline" : ""
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            Vis board/
          </h2>
        </Popover>
        <input
          ref={inputRef}
          className={`text-[#FF7777]/90 max-w-32 outline-none bg-[#FFF5E6] ${
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
