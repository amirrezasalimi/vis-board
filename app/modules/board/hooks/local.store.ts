import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
type State = {
  isReceivingMessage: boolean;
  setIsReceivingMessage: (isReceivingMessage: boolean) => void;
};
const useLocalStore = create<State>()(
  immer((set) => ({
    isReceivingMessage: false,
    setIsReceivingMessage: (isReceivingMessage: boolean) =>
      set((state) => {
        state.isReceivingMessage = isReceivingMessage;
      }),
  }))
);

export default useLocalStore;
