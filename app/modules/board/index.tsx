import BoardCanvas from "./components/canvas";
import Menu from "./components/menu";
import MessageInputs from "./components/message-inputs";
import Settings from "./components/settings";

const BoardMain = () => {
  return (
    <div className="flex bg-[#FFF5E6] h-screen size-full">
      <Menu />
      <MessageInputs />
      <BoardCanvas />
      <Settings />
    </div>
  );
};

export default BoardMain;
