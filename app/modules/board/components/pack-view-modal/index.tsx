import Modal from "~/shared/components/modal";
import type { CardPack } from "../../types/card";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pack: CardPack | null;
}

const PackViewModal = ({ isOpen, onClose, pack }: Props) => {
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    setFlippedCardId((prev) => (prev === cardId ? null : cardId));
  };

  useEffect(() => {
    if (!isOpen) {
      setFlippedCardId(null);
    }
  }, [isOpen]);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="p-4 w-full h-5/6 overflow-hidden"
      size="xl"
    >
      <h1 className="font-semibold text-lg capitalize">{pack?.title}</h1>
      <div className="gap-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 py-4 pb-8 w-full h-full overflow-y-auto">
        {pack?.cards.map((card) => (
          <div
            key={card.id}
            className="relative flex justify-center items-center bg-[#F9F9F9] p-2 border-[#EBEBEB] border-2 rounded-md w-full !aspect-[1/1.26] text-center"
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`card-inner relative w-full h-full transition-transform duration-500 transform ${
                flippedCardId === card.id ? "rotate-y-180" : ""
              }`}
            >
              {/* Front of the card */}
              <div className="absolute inset-0 flex justify-center items-center text-lg card-front">
                <h3>{card.title}</h3>
              </div>
              {/* Back of the card */}
              <div className="absolute inset-0 overflow-y-auto text-sm rotate-y-180 card-back transform">
                <p className="flex justify-center items-center m-1 size-full">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default PackViewModal;
