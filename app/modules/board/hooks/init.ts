import { getBoardStore, useReactiveBoardStoreWithRoom } from "./board.store";
import { useReactiveGlobalStore } from "./global.store";
import { BoardService } from "../services/board.service";

const useIniter = () => {
  const globalStore = useReactiveGlobalStore();

  const init = async (boardId: string) => {
    const { store } = getBoardStore(boardId);

    try {
      // If already initialized, just return
      if (store?.config?.isInitialized) {
        return true;
      }

      // Get existing chat data if available
      const existingChat = globalStore.chats.find(
        (chat) => chat.id === boardId
      );
      if (!existingChat) {
        throw new Error("Board not found");
      }

      // Initialize the board with existing data
      const boardData = BoardService.createBoard(boardId, existingChat.title);
      Object.assign(store.branches, boardData.branches);
      Object.assign(store.config, boardData.config);

      return true;
    } catch (error) {
      console.error("Board initialization failed:", error);
      throw error;
    }
  };

  return { init };
};

export default useIniter;
