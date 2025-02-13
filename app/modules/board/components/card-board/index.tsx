import { useState } from "react";
import { type CardPack as CardPackType, type Card } from "../../types/card";
import { useReactiveBoardStore } from "../../hooks/board.store";
import AddCardsPack from "../add-cards-pack";
import CardPack from "../card-pack";
import PackViewModal from "../pack-view-modal";

const CardBoard = () => {
  const state = useReactiveBoardStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPack, setCurrentPack] = useState<CardPackType | null>(null);

  const packs = [...(state.cardsPacks ?? [])].reverse().filter((pack) => {
    return pack.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 mx-auto mt-14 container">
      {/* modal */}
      <PackViewModal
        isOpen={!!currentPack}
        onClose={() => setCurrentPack(null)}
        pack={currentPack}
      />

      {/* search */}
      <div>
        <input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#FFEED5] bg-transparent p-2 px-4 rounded-md outline-none w-1/4"
        />
      </div>
      {searchTerm.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Search result for</span>
          <span className="font-semibold text-sm">{searchTerm}</span>
        </div>
      )}
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 h-full">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="size-full"
            onClick={() => setCurrentPack(pack)}
          >
            <CardPack {...pack} />
          </div>
        ))}
      </div>

      <AddCardsPack />
    </div>
  );
};

export default CardBoard;
