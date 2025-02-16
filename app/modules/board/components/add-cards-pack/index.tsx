import { useEffect, useRef, useState } from "react";
import Modal from "~/shared/components/modal";
import CardPack from "../card-pack";
import { type Card } from "../../types/card";
import useCardsAi from "../../hooks/cards-ai";
import {
  useBoardStoreYDoc,
  useReactiveBoardStore,
} from "../../hooks/board.store";
import { makeId } from "~/shared/utils/id";
import { HexColorPicker } from "react-colorful";
import { Popover } from "react-tiny-popover";

const AddCardsPack = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [color, setColor] = useState("#7EBFE6");
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [title, setTitle] = useState("My Pack");
  const [count, setCount] = useState(10);
  const [cards, setCards] = useState<Card[]>([]);
  const [description, setDescription] = useState("");
  const ai = useCardsAi();
  const store = useReactiveBoardStore();
  const doc = useBoardStoreYDoc();
  const [modalIsLoaded, setModalIsLoaded] = useState(false);
  const [editCardIndex, setEditCardIndex] = useState<number | null>(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardDescription, setEditCardDescription] = useState("");

  const generate = async () => {
    const cards = await ai.create(title, description, count);
    if (cards.length) {
      setCards(cards);
    }
  };
  const save = () => {
    if (!store.cardsPacks?.length) {
      doc.getArray("cardsPacks");
    }
    store.cardsPacks.push({
      title,
      description,
      cost: 0,
      cards,
      id: makeId(5),
      theme: "gradient",
      timestamp: 0,
      gradient_color: color,
    });
    setIsOpen(false);
  };
  const popoverRef = useRef(null);

  useEffect(() => {
    setModalIsLoaded(true);
  }, []);

  const handleCardClick = (index: number) => {
    setEditCardIndex(index);
    setEditCardTitle(cards[index].title);
    setEditCardDescription(cards[index].description);
  };

  const handleSaveCard = () => {
    if (editCardIndex !== null) {
      const newCards = [...cards];
      newCards[editCardIndex] = {
        ...newCards[editCardIndex],
        title: editCardTitle,
        description: editCardDescription,
      };
      setCards(newCards);
      setEditCardIndex(null);
    }
  };

  return (
    <div>
      <Modal
        className="p-6 h-[90vh] overflow-hidden card-pack-modal"
        size="lg"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div
          className="flex flex-col gap-6 w-full h-full overflow-hidden"
          ref={popoverRef}
        >
          <div className="flex gap-6 h-2/5">
            <div className="shadow-lg rounded-lg w-1/4 size-full">
              <CardPack
                title={title}
                cost={0}
                cards={new Array(count).fill(0)}
                description={description}
                id="1"
                theme="default"
                timestamp={0}
                gradient_color={color}
                className="w-full h-full aspect-[1/1.26]"
              />
            </div>
            <div className="flex flex-col gap-6 size-full">
              <div className="flex items-center gap-6 w-full">
                <input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-md outline-none w-3/5 h-12 text-lg"
                />
                <div className="flex items-center gap-3 w-2/5">
                  <span className="text-lg">Count:</span>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="px-3 py-2 border-2 border-gray-300 rounded-md outline-none w-full text-lg text-center"
                  />
                </div>
                <div className="flex items-center gap-3 w-1/5">
                  <span className="text-lg">Color</span>
                  {!!modalIsLoaded && (
                    <Popover
                      isOpen={isColorOpen}
                      onClickOutside={() => setIsColorOpen(false)}
                      positions={["left"]}
                      parentElement={popoverRef.current || undefined}
                      content={
                        <HexColorPicker
                          className="z-[1000] p-4"
                          color={color}
                          onChange={setColor}
                        />
                      }
                    >
                      <div
                        className="rounded-md size-6 cursor-pointer"
                        onClick={() => setIsColorOpen(true)}
                        style={{ background: color }}
                      />
                    </Popover>
                  )}
                </div>
              </div>
              <textarea
                placeholder="Description..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-md outline-none w-full text-lg"
              />
              <div className="flex gap-4">
                <button
                  onClick={generate}
                  className="bg-[#FF7F7F] hover:bg-[#e67272] px-8 py-3 rounded-md w-full text-white text-lg transition-colors"
                >
                  {ai.isLoading ? "..." : "Generate"}
                </button>
                {!!cards.length && (
                  <button
                    onClick={save}
                    className="bg-teal-400 hover:bg-teal-500 px-8 py-3 rounded-md text-white text-lg transition-colors"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 h-3/5">
            <div className="flex justify-center items-center gap-3 w-full h-8 text-lg">
              <div>Cards</div>
              <div>
                {!!cards.length && (
                  <button
                    className="text-red-500 text-sm hover:underline"
                    onClick={() => setCards([])}
                  >
                    Remove All
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 divide-y-2 h-full overflow-y-auto">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col gap-2 hover:bg-gray-50 py-2 cursor-pointer"
                  onClick={() => handleCardClick(i)}
                >
                  <span className="font-semibold text-lg">
                    {i + 1}. {card.title}
                  </span>
                  <span className="text-gray-700">{card.description}</span>
                  <div className="top-1/2 right-2 absolute flex justify-center items-center bg-white hover:bg-red-50 opacity-0 group-hover:opacity-100 border border-red-500 rounded-full size-8 text-red-500 text-xl transition-all -translate-y-1/2 cursor-pointer">
                    x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      <button
        onClick={() => setIsOpen(true)}
        className="bottom-6 left-1/2 z-20 fixed bg-[#FF7F7F] hover:bg-[#e67272] px-8 py-3 rounded-full text-white text-lg hover:scale-105 transition-all -translate-x-1/2"
      >
        Add
      </button>
      {editCardIndex !== null && (
        <Modal
          className="p-6"
          size="md"
          isOpen={editCardIndex !== null}
          onClose={() => setEditCardIndex(null)}
        >
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-2xl">Edit Card</h2>
            <input
              type="text"
              placeholder="Title"
              value={editCardTitle}
              onChange={(e) => setEditCardTitle(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-md outline-none w-full text-lg"
            />
            <textarea
              placeholder="Description"
              rows={5}
              value={editCardDescription}
              onChange={(e) => setEditCardDescription(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-md outline-none w-full text-lg"
            />
            <button
              onClick={handleSaveCard}
              className="bg-teal-400 hover:bg-teal-500 px-8 py-3 rounded-md text-white text-lg transition-colors"
            >
              Save Card
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AddCardsPack;
