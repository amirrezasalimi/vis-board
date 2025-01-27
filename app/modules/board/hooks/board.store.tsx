import { getYjsDoc, syncedStore } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import { useSyncedStore as useReactSyncedStore } from "@syncedstore/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { BranchNodeData, KnowledgeNodeData } from "../types/nodes";
import type { Node } from "@xyflow/react";
import type { ExtraEdge } from "../types/edge";

type Store = {
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

interface StoreState {
  store: ReturnType<typeof syncedStore<Store>>;
  isLoaded: boolean;
  roomId: string;
}

const StoreContext = createContext<StoreState | null>(null);

function createStore(roomId: string) {
  const store = syncedStore({
    branches: {} as Store["branches"],
    knowledges: {} as Store["knowledges"],
    config: {} as Store["config"],
    edges: [] as Store["edges"],
  });
  const doc = getYjsDoc(store);

  // Only create IndexedDB persistence on the client side
  let persistence: IndexeddbPersistence | null = null;
  if (typeof window !== "undefined") {
    persistence = new IndexeddbPersistence(roomId, doc);
  }

  return {
    store,
    persistence,
    doc,
  };
}

export function BoardStoreProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [store] = useState(() => createStore(roomId).store);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { persistence } = createStore(roomId);

    if (persistence) {
      persistence.once("synced", () => {
        setIsLoaded(true);
      });
    }
  }, [roomId]);

  return (
    <StoreContext.Provider value={{ store, isLoaded, roomId }}>
      {children}
    </StoreContext.Provider>
  );
}

function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("Store hooks must be used within StoreProvider");
  }
  return context;
}

export function useBoardStore() {
  return useStoreContext();
}

export function useReactiveBoardStore() {
  const { store } = useStoreContext();
  return useReactSyncedStore(store);
}

export function useBoardStoreYDoc() {
  const { store } = useStoreContext();
  return getYjsDoc(store);
}

export function useBoardSyncedState(roomId: string) {
  const [state, setState] = useState<StoreState>(() => ({
    store: createStore(roomId).store,
    isLoaded: typeof window === "undefined", // Consider it loaded on server-side
    roomId,
  }));

  useEffect(() => {
    // Only run IndexedDB initialization on the client side
    if (typeof window === "undefined") return;

    const { persistence } = createStore(roomId);

    if (persistence) {
      persistence.once("synced", () => {
        setState((prev) => ({ ...prev, isLoaded: true }));
      });

      return () => {
        persistence.destroy();
      };
    }
  }, [roomId]);

  // if (!state.isLoaded) {
  //   return null;
  // }

  return useReactSyncedStore(state.store);
}
