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

export interface Chat {
  id: string;
}

type GlobalSchema = {
  chats: Chat[];
};

// Create the Global store context
export const GlobalStoreContext = createSyncedStoreContext<GlobalSchema>();

// Define the Global schema structure
const GlobalSchema: Record<keyof GlobalSchema, any> = {
  chats: [],
};

// Create Global-specific hooks
export const useGlobalStore = createUseSyncedStore(GlobalStoreContext);
export const useReactiveGlobalStore =
  createUseReactiveStore(GlobalStoreContext);
export const useGlobalStoreYDoc = createUseYDoc(GlobalStoreContext);
export const useReactiveGlobalStoreWithRoom =
  createUseReactiveStoreWithRoomId(GlobalSchema);

export function GlobalStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SyncedStoreProvider<GlobalSchema>
      Context={GlobalStoreContext}
      roomId={"global"}
      schema={GlobalSchema}
    >
      {children}
    </SyncedStoreProvider>
  );
}
