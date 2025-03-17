import Modal from "~/shared/components/modal";
import type { CardPack } from "../../types/card";
import { useEffect, useState } from "react";
import { useReactiveBoardStore } from "../../hooks/board.store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pack: CardPack | null;
}

const PackViewModal = ({ isOpen, onClose, pack }: Props) => {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const store = useReactiveBoardStore();

  const handleCardClick = (cardId: string) => {
    setFlippedCardId((prev) => (prev === cardId ? null : cardId));
  };

  useEffect(() => {
    if (!isOpen) {
      setFlippedCardId(null);
    }
  }, [isOpen]);

  const removePack = () => {
    const index = store.cardsPacks.findIndex((p) => p.id === pack?.id);
    if (index !== -1) {
      onClose();
      setFlippedCardId(null);
      store.cardsPacks.splice(index, 1);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white shadow-xl p-6 rounded-lg w-full h-5/6 overflow-hidden"
      size="xl"
    >
      <div className="flex justify-between items-center pb-4 border-gray-200 border-b">
        <h1 className="font-semibold text-gray-800 text-xl capitalize">
          {pack?.title}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="hover:bg-gray-100 px-4 py-2 rounded-md text-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={removePack}
            className="bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md text-red-600 transition-colors"
          >
            Remove Pack
          </button>
        </div>
      </div>
      <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 py-6 pb-12 w-full h-full overflow-y-auto">
        {pack?.cards.map((card) => (
          <div
            key={card.id}
            className="perspective-1000 cursor-pointer"
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`relative w-full transition-transform duration-500 transform-style-3d ${
                flippedCardId === card.id ? "rotate-y-180" : ""
              }`}
              style={{ aspectRatio: "1/1.4" }}
            >
              {/* Front of the card */}
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-white shadow-lg border-2 border-gray-100 rounded-xl backface-hidden">
                <div className="top-0 left-0 absolute bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-xl w-full h-2"></div>
                <div className="flex justify-center items-center bg-gradient-to-br from-blue-100 to-blue-50 mb-3 rounded-full w-12 h-12">
                  <span className="text-blue-500 text-xl">📝</span>
                </div>
                <h3 className="px-4 font-medium text-gray-800 text-lg text-center">
                  {card.title}
                </h3>
                <div className="bottom-3 absolute flex justify-center w-full">
                  <span className="text-gray-400 text-xs">Click to flip</span>
                </div>
              </div>

              {/* Back of the card */}
              <div className="absolute inset-0 bg-white shadow-lg border-2 border-gray-100 rounded-xl overflow-y-auto rotate-y-180 backface-hidden">
                <div className="top-0 left-0 absolute bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-xl w-full h-2"></div>
                <div className="flex flex-col p-5 h-full">
                  <h4 className="mb-2 font-medium text-gray-700 text-base">
                    {card.title}
                  </h4>
                  <div className="flex-grow overflow-y-auto">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default PackViewModal;
