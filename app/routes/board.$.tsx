import { useParams } from "react-router";
import BoardMain from "~/modules/board";
import { BoardStoreProvider } from "~/modules/board/hooks/board.store";
import { GlobalStoreProvider } from "~/modules/board/hooks/global.store";

const Board = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  return (
    <GlobalStoreProvider>
      <BoardStoreProvider boardId={id}>
        <BoardMain />
      </BoardStoreProvider>
    </GlobalStoreProvider>
  );
};

export default Board;
