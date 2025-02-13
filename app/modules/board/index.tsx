import { useLocalStorage } from "@uidotdev/usehooks";
import CanvasBoard from "./components/canvas-board";
import Menu from "./components/menu";
import MessageInputs from "./components/message-inputs";
import Settings from "./components/settings";
import ModeSwitch from "./components/mode-switch";
import CardBoard from "./components/card-board";

const BoardMain = () => {
  const [mode, setMode] = useLocalStorage<"canvas" | "cards">("mode", "canvas");
  return (
    <div className="flex w-screen h-screen size-full select-none">
      <ModeSwitch mode={mode} setMode={setMode} />
      <Menu />
      <Settings />
      <div
        className={`size-full w-screen h-screen inset-0 ${
          mode !== "canvas" ? "invisible opacity-0" : ""
        }`}
      >
        <CanvasBoard />
        <MessageInputs />
      </div>
      <div
        className={`size-full absolute inset-0 ${
          mode !== "cards" ? "invisible opacity-0" : ""
        }`}
      >
        <CardBoard />
      </div>
    </div>
  );
};

export default BoardMain;
