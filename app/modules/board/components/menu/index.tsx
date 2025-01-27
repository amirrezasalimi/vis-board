import { useState, useRef, useEffect } from "react";
import { useReactiveBoardStore } from "../../hooks/board.store";
import { Popover } from "react-tiny-popover";

const Menu = () => {
  const { config } = useReactiveBoardStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 hover:bg-[#ffc885] px-2 py-1 rounded-md cursor-pointer"
                  >
                    <div className="bg-[#FF7777] rounded-full w-1 h-1"></div>
                    <span>Untitled</span>
                  </div>
                ))}
              </div>
              <div>
                <button className="border-[#ffc885] hover:bg-[#ffefd8] px-2 py-1 border rounded-md w-full text-sm">
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
          className={` text-[#FF7777]/90 max-w-32 outline-none bg-[#FFF5E6] ${
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
    </div>
  );
};

export default Menu;
