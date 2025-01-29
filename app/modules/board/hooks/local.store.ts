import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
type State = {
  isReceivingMessage: boolean;
  setIsReceivingMessage: (isReceivingMessage: boolean) => void;

  generatingFollowups: boolean;
  setGeneratingFollowups: (generatingFollowups: boolean) => void;
};
const useLocalStore = create<State>()(
  immer((set) => ({
    isReceivingMessage: false,
    setIsReceivingMessage: (isReceivingMessage: boolean) =>
      set((state) => {
        state.isReceivingMessage = isReceivingMessage;
      }),
    generatingFollowups: false,
    setGeneratingFollowups(generatingFollowups) {
      set((state) => {
        state.generatingFollowups = generatingFollowups;
      });
    },
  }))
);

export default useLocalStore;
