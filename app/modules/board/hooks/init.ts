import { useReactiveBoardStore, useBoardSyncedState } from "./board.store";

const useIniter = (id: string) => {
  const store = useBoardSyncedState(id);
  const init = () => {
    console.log("init", store?.branches);

    if (!store) {
      return;
    }
    const { branches, config } = store;
    const title = config.title || "Empty Board";
    document.title = title;

    if (!config || config.isInitialized) {
      return;
    }
    // init branch
    const id = "main-branch";
    config.activeBranch = id;
    branches[id] = {
      type: "branch",
      id,
      data: {
        title: "Main",
        messages: [
          {
            content: "Hey, How can i Help you?!",
            role: "assistant",
            timestamp: Date.now(),
            token_per_second: 0,
            took_seconds: 0,
          },
        ],
      },
      position: { x: 0, y: 0 },
    };
    config.isInitialized = true;
  };
  return { init };
};

export default useIniter;
