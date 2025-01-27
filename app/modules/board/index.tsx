import BoardCanvas from "./components/canvas";
import Title from "./components/title";
import MessageInputs from "./components/message-inputs";
import Settings from "./components/settings";

const BoardMain = () => {
  return (
    <div className="flex bg-[#FFF5E6] h-screen size-full">
      <Title />
      <MessageInputs />
      <BoardCanvas />
      <Settings />
    </div>
  );
};

export default BoardMain;
