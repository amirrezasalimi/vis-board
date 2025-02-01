import { getYjsDoc, syncedStore } from "@syncedstore/core";
import { IndexeddbPersistence } from "y-indexeddb";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MappedTypeDescription } from "node_modules/@syncedstore/core/types/doc";
import { useSyncedStore as useReactSyncedStore } from "@syncedstore/react";

// Base store schema that all stores should extend
type BaseSchema = {
  config: {
    version: string;
    isInitialized: boolean;
    title: string;
    activeBranch: string;
  };
};

type StoreState<T extends BaseSchema> = {
  store: MappedTypeDescription<T>;
  isLoaded: boolean;
  roomId: string;
};

interface CreateSyncedStoreOptions<T extends BaseSchema> {
  roomId: string;
  schema: T;
}

export function createSyncedStore<T extends BaseSchema>(
  options: CreateSyncedStoreOptions<T>
) {
  const { roomId, schema } = options;

  // Create the store with the defined schema
  const store = syncedStore<T>(schema);
  const doc = getYjsDoc(store);

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

export function createSyncedStoreContext<T extends BaseSchema>() {
  return createContext<StoreState<T> | null>(null);
}

export function SyncedStoreProvider<T extends BaseSchema>({
  children,
  roomId,
  schema,
  Context,
}: {
  children: React.ReactNode;
  roomId: string;
  schema: T;
  Context: React.Context<StoreState<T> | null>;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [store] = useState(
    () => createSyncedStore<T>({ roomId, schema }).store
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { persistence } = createSyncedStore<T>({ roomId, schema });

    if (persistence) {
      persistence.once("synced", () => {
        setIsLoaded(true);
      });

      return () => {
        persistence.destroy();
      };
    }
  }, [roomId, schema]);

  return (
    <Context.Provider value={{ store, isLoaded, roomId }}>
      {children}
    </Context.Provider>
  );
}

// Factory function for useSyncedStore hook
export function createUseSyncedStore<T extends BaseSchema>(
  Context: React.Context<StoreState<T> | null>
) {
  return function useSyncedStore() {
    const context = useContext(Context);
    if (!context) {
      throw new Error(
        "useSyncedStore must be used within a SyncedStoreProvider"
      );
    }
    return context;
  };
}

// Factory function for useReactiveStore hook
export function createUseReactiveStore<T extends BaseSchema>(
  Context: React.Context<StoreState<T> | null>
) {
  return function useReactiveStore() {
    const { store } = createUseSyncedStore(Context)();
    return useReactSyncedStore(store);
  };
}

// Factory function for useYDoc hook
export function createUseYDoc<T extends BaseSchema>(
  Context: React.Context<StoreState<T> | null>
) {
  return function useYDoc() {
    const { store } = createUseSyncedStore(Context)();
    return getYjsDoc(store);
  };
}

export function createUseReactiveStoreWithRoomId<T extends BaseSchema>() {
  return function useReactiveStore(roomId: string) {
    // Create a new store instance for the given roomId
    const { store } = useMemo(
      () =>
        createSyncedStore<T>({
          roomId,
          schema: {} as T, // Pass the schema (will be overridden in board-store.ts)
        }),
      [roomId]
    );

    // Use the reactive store hook
    return useReactSyncedStore(store);
  };
}
