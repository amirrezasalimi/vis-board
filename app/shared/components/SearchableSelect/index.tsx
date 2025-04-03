import { useState } from "react";

export interface SelectOption {
  id: string;
  label?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  selectedOption?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  direction?: "top" | "bottom";
  className?: string;
  maxHeight?: string;
}

const SearchableSelect = ({
  options,
  selectedOption,
  onSelect,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  direction = "bottom",
  className = "",
  maxHeight = "150px",
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) =>
    (option.label || option.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = selectedOption
    ? options.find((option) => option.id === selectedOption)?.label ||
      selectedOption
    : placeholder;

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="flex justify-between items-center bg-[#FFF5E6] px-2 py-2 border border-[#ffc885] rounded-xl outline-none w-full text-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedLabel}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            direction === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } left-0 w-full bg-[#FFF5E6] border border-[#ffc885] rounded-xl overflow-y-auto z-30 shadow-md`}
          style={{ maxHeight }}
        >
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="top-0 sticky bg-[#FFF5E6] px-2 py-2 border-[#ffc885] border-b outline-none w-full text-sm"
            type="text"
            placeholder={searchPlaceholder}
            onClick={(e) => e.stopPropagation()}
          />

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`px-2 py-1 cursor-pointer hover:bg-[#ffefd8] ${
                  selectedOption === option.id ? "bg-[#ffefd8]" : ""
                }`}
                onClick={() => handleSelect(option.id)}
              >
                {option.label || option.id}
              </div>
            ))
          ) : (
            <div className="px-2 py-1">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
