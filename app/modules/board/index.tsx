import { useLocalStorage } from "@uidotdev/usehooks";
import CanvasBoard from "./components/canvas-board";
import Menu from "./components/menu";
import MessageInputs from "./components/message-inputs";
import Settings from "./components/settings";
import ModeSwitch from "./components/mode-switch";
import CardBoard from "./components/card-board";
import BooksBoard from "./components/books-board";

type Mode = "canvas" | "cards" | "books";

const BoardMain = () => {
  const [mode, setMode] = useLocalStorage<Mode>("mode", "canvas");

  const boards = {
    canvas: (
      <>
        <CanvasBoard />
        <MessageInputs />
      </>
    ),
    cards: <CardBoard />,
    books: <BooksBoard />
  };

  return (
    <div className="flex w-screen h-screen size-full select-none">
      <ModeSwitch mode={mode} setMode={setMode} />
      <Menu />
      <Settings />
      {Object.entries(boards).map(([key, Board]) => (
        <div
          key={key}
          className={`size-full absolute inset-0 transition-opacity duration-300 ${
            mode !== key ? "invisible opacity-0" : "opacity-100"
          }`}
        >
          {Board}
        </div>
      ))}
    </div>
  );
};

export default BoardMain;
