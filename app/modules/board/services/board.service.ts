import { makeId } from "~/shared/utils/id";
import type { Chat } from "../hooks/global.store";

export class BoardService {
  static createBoard(id: string, title: string = "Unknown") {
    return {
      branches: {
        "main-branch": {
          type: "branch" as const,
          id: "main-branch",
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
        },
      },
      config: {
        id,
        title,
        version: "0.1",
        activeBranch: "main-branch",
        isInitialized: true,
      },
    };
  }

  static createChatEntry(id: string, title: string): Chat {
    return { id, title };
  }
}
