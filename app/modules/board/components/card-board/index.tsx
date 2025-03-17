import { useState, useCallback } from "react";
import { type CardPack as CardPackType, type Card } from "../../types/card";
import { useReactiveBoardStore } from "../../hooks/board.store";
import AddCardsPack from "../add-cards-pack";
import CardPack from "../card-pack";
import PackViewModal from "../pack-view-modal";
import { Search } from "lucide-react";

const CardBoard = () => {
  const state = useReactiveBoardStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentPack, setCurrentPack] = useState<CardPackType | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const packs = [...(state.cardsPacks ?? [])].reverse().filter((pack) => {
    return pack.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const showEmptyState = packs.length === 0;

  const handleSearch = useCallback((value: string) => {
    setSearchError(null);
    if (value.length > 50) {
      setSearchError("Search term too long");
      return;
    }
    setSearchTerm(value);
  }, []);

  return (
    <div className="flex flex-col gap-6 mx-auto mt-14 container">
      {/* modal */}
      <PackViewModal
        isOpen={!!currentPack}
        onClose={() => setCurrentPack(null)}
        pack={currentPack}
      />

      {/* search */}
      <div className="flex justify-between items-center">
        <div className="relative w-1/4">
          <div className="left-3 absolute inset-y-0 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            placeholder="Search packs..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={`bg-[#FFEED5] pl-10 pr-4 py-2 rounded-md outline-none w-full transition-colors
              ${
                searchError
                  ? "border-2 border-red-400"
                  : "hover:bg-[#FFE5C0] focus:bg-[#FFE5C0]"
              }`}
          />
          {searchError && (
            <p className="-bottom-6 left-0 absolute text-red-500 text-sm">
              {searchError}
            </p>
          )}
        </div>
        <AddCardsPack
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        <button
          onClick={() => {
            setCurrentPack(null);
            setIsAddModalOpen(true);
          }}
          className="bg-[#FF7F7F] hover:bg-[#e67272] px-8 py-2 rounded-full outline-none text-white text-lg hover:scale-105 transition-all"
        >
          Add
        </button>
      </div>
      {searchTerm.length > 0 && !searchError && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Search results for</span>
          <span className="bg-[#FFEED5] px-2 py-0.5 rounded font-semibold text-sm">
            {searchTerm}
          </span>
        </div>
      )}
      {showEmptyState ? (
        <div className="flex flex-col justify-center items-center gap-4 py-20">
          <p className="text-gray-500 text-lg">No cards available yet</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-blue-500 hover:underline"
          >
            Create your first pack
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default CardBoard;
