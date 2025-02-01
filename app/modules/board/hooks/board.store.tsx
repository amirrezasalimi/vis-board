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
export const useReactiveBoardStoreWithRoom =
  createUseReactiveStoreWithRoomId<BoardSchema>();

export function BoardStoreProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  return (
    <SyncedStoreProvider<BoardSchema>
      Context={BoardStoreContext}
      roomId={roomId}
      schema={boardSchema}
    >
      {children}
    </SyncedStoreProvider>
  );
}
