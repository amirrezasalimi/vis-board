import React, { useState } from "react";

interface SidePanelProps {
  numPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  translations: {
    [page: number]: {
      content: string;
      translation: string;
      status: "idle" | "translating" | "completed";
    };
  };
}

const SidePanel: React.FC<SidePanelProps> = ({
  numPages,
  currentPage,
  setCurrentPage,
  translations,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button - visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-2 z-50 bg-white shadow-lg p-2 rounded-lg border"
        aria-label="Toggle side panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      <div className={`top-16 bottom-2 left-2 z-40 fixed flex flex-col bg-white shadow-lg p-4 border rounded-lg w-48 overflow-hidden transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Page counter section */}
        <div className="mb-4">
          <h3 className="mb-2 font-bold text-sm">Pages</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-xs">Current:</span>
            <span className="font-medium text-sm">{currentPage}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-xs">Total:</span>
            <span className="font-medium text-sm">{numPages}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600 text-xs">Translated:</span>
            <span className="font-medium text-sm">
              {
                Object.values(translations).filter(
                  (t) => t.status === "completed"
                ).length
              }
            </span>
          </div>
        </div>

        {/* Mini map section */}
        <div className="flex-1 overflow-auto">
          <h3 className="mb-2 font-bold text-sm">Document Map</h3>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => {
              const status = translations[page]?.status;
              let bgColor = "bg-gray-200"; // default - not started

              if (status === "translating") bgColor = "bg-amber-200";
              else if (status === "completed") bgColor = "bg-green-200";

              // Highlight current page
              const isCurrentPage = page === currentPage;
              const border = isCurrentPage ? "border-2 border-blue-500" : "";

              return (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    // Use the list reference to scroll to the page
                    if (window.pdfListRef) {
                      window.pdfListRef.scrollToItem(page - 1, "start");
                    }
                  }}
                  className={`w-7 h-7 ${bgColor} ${border} flex items-center justify-center rounded-sm text-xs hover:opacity-80`}
                  title={`Page ${page} - ${status || "not translated"}`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
