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
  };
  const popoverRef = useRef(null);

  useEffect(() => {
    setModalIsLoaded(true);
  }, []);

  return (
    <div>
      <Modal
        className="p-4 h-5/6 overflow-hidden card-pack-modal"
        size="lg"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div
          className="flex flex-col gap-4 w-full h-full overflow-hidden"
          ref={popoverRef}
        >
          <div className="flex gap-2 h-4/6">
            <div className="w-1/4 size-full">
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
            <div className="flex flex-col gap-4 size-full">
              <div className="flex items-center gap-4 w-full">
                <input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-2 py-1 border-2 border-gray-400 rounded-lg outline-none w-3/5 h-12"
                />
                <div className="flex items-center gap-2 w-1/5">
                  <span>Count:</span>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="px-2 py-1 border-2 border-gray-400 rounded-lg outline-none w-full text-center"
                  />
                </div>
                <div className="flex items-center gap-2 w-1/5">
                  <span>Color</span>
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
                        className="rounded-md size-5"
                        onClick={() => setIsColorOpen(true)}
                        style={{ background: color }}
                      />
                    </Popover>
                  )}
                </div>
              </div>
              <textarea
                placeholder="description..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-2 py-1 border-2 border-gray-400 rounded-lg outline-none w-full"
              />
              <div className="flex gap-4">
                <button
                  onClick={generate}
                  className="bg-[#FF7F7F] px-8 py-2 rounded-lg w-full text-white text-lg"
                >
                  {ai.isLoading ? "..." : "Generate"}
                </button>
                {!!cards.length && (
                  <button
                    onClick={save}
                    className="bg-teal-400 px-8 py-2 rounded-lg text-white text-lg"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 h-3/6">
            <div className="flex justify-center items-center gap-3 w-full h-6">
              <div>Cards</div>
              <div>
                {!!cards.length && (
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => setCards([])}
                  >
                    Remove All
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 divide-y-2 h-full overflow-x-auto">
              {cards.map((card, i) => (
                <div className="group relative flex flex-col gap-2">
                  <span className="font-semibold">
                    {i + 1}. {card.title}
                  </span>
                  <span>{card.description}</span>
                  <div className="top-1/2 right-2 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 border border-red-500 rounded-full size-8 text-red-500 text-xl transition-all right-2-translate-y-1/2 cursor-pointer">
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
        className="bottom-4 left-1/2 z-20 fixed bg-[#FF7F7F] px-8 py-2 rounded-full text-white text-lg hover:scale-105 transition-all -translate-x-1/2"
      >
        Add
      </button>
    </div>
  );
};

export default AddCardsPack;
