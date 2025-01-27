import { useParams } from "react-router";
import BoardMain from "~/modules/board";
import { BoardStoreProvider } from "~/modules/board/hooks/board.store";

const Board = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  return (
    <BoardStoreProvider roomId={id}>
      <BoardMain />
    </BoardStoreProvider>
  );
};

export default Board;
