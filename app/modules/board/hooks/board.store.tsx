import type { BranchNodeData, KnowledgeNodeData } from "../types/nodes";
import type { Node } from "@xyflow/react";
import type { ExtraEdge } from "../types/edge";
import {
  createSyncedStoreContext,
  SyncedStoreProvider,
  createUseSyncedStore,
  createUseReactiveStore,
  createUseYDoc,
  createUseReactiveStoreWithRoomId,
} from "./store";

export const boardPrefix = "board-";
// Define the board schema extending BaseSchema
type BoardSchema = {
  config: {
    version: string;
    isInitialized: boolean;
    title: string;
    activeBranch: string;
  };
  branches: {
    [key: string]: Node<BranchNodeData>;
  };
  knowledges: {
    [key: string]: Node<KnowledgeNodeData>;
  };
  edges: ExtraEdge[];
};

// Create the board store context
export const BoardStoreContext = createSyncedStoreContext<BoardSchema>();

// Define the board schema structure
const boardSchema: Record<keyof BoardSchema, any> = {
  config: {},
  branches: {},
  knowledges: {},
  edges: [],
};

// Create board-specific hooks
export const useBoardStore = createUseSyncedStore(BoardStoreContext);
export const useReactiveBoardStore = createUseReactiveStore(BoardStoreContext);
export const useBoardStoreYDoc = createUseYDoc(BoardStoreContext);
export const useReactiveBoardStoreWithRoom = createUseReactiveStoreWithRoomId(
  boardSchema,
  boardPrefix
);

export function BoardStoreProvider({
  children,
  boardId,
}: {
  children: React.ReactNode;
  boardId: string;
}) {
  return (
    <SyncedStoreProvider<BoardSchema>
      Context={BoardStoreContext}
      roomId={`${boardPrefix}${boardId}`}
      schema={boardSchema}
    >
      {children}
    </SyncedStoreProvider>
  );
}
