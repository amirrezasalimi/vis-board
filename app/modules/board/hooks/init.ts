import { makeId } from "~/shared/utils/id";
import { useReactiveBoardStoreWithRoom } from "./board.store";
import { useReactiveGlobalStore } from "./global.store";

const useIniter = (boardId: string) => {
  const store = useReactiveBoardStoreWithRoom(boardId);
  const globalStore = useReactiveGlobalStore();
  const init = () => {
    if (!store) {
      return;
    }

    let { branches, config } = store;
    if (config?.isInitialized) {
      return;
    }
    // init branch
    const branchId = "main-branch";
    config.activeBranch = branchId;
    branches[branchId] = {
      type: "branch",
      id: branchId,
      data: {
        title: "Main",
        messages: [
          {
            id: makeId(),
            content: "Hey, How can i Help you?!",
            role: "assistant",
            timestamp: Date.now(),
            token_per_second: 0,
            took_seconds: 0,
            followups: [],
          },
        ],
      },
      position: { x: 0, y: 0 },
    };
    config.id = boardId;
    config.title = "Untitled";
    config.version = "0.1";
    config.activeBranch = branchId;
    config.isInitialized = true;
    globalStore.chats.push({ id: boardId, title: config.title });
  };
  return { init };
};

export default useIniter;
