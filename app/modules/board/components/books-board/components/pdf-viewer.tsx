import React, { useCallback } from "react";
import { Document, Page } from "react-pdf";
import { FixedSizeList as List } from "react-window";
import TranslationPanel from "./translation-panel";

interface PageComponentProps {
  index: number;
  style: React.CSSProperties;
}

interface PdfViewerProps {
  pdfFile: File | null;
  numPages: number;
  setNumPages: (num: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  translations: {
    [page: number]: {
      content: string;
      translation: string;
      status: "idle" | "translating" | "completed";
    };
  };
  showTranslation: boolean;
  listRef: (node: any) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfFile,
  numPages,
  setNumPages,
  currentPage,
  setCurrentPage,
  translations,
  showTranslation,
  listRef,
}) => {
  const PageRow = useCallback(
    ({ index, style }: PageComponentProps) => {
      const pageNumber = index + 1;
      const pageTranslation = translations[pageNumber];
      const isTranslatingPage = pageTranslation?.status === "translating";
      const isCompleted = pageTranslation?.status === "completed";

      return (
        <div
          style={{ ...style }}
          className="relative flex md:flex-row flex-col justify-between gap-4 w-full"
        >
          {/* Translation status indicator */}
          <div className="top-1 right-1 z-10 absolute flex items-center gap-2">
            {isTranslatingPage && (
              <div className="flex items-center bg-amber-100 p-0.5 rounded-full text-amber-800">
                <svg className="mr-1 w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xs">Translating</span>
              </div>
            )}
            {isCompleted && (
              <div className="bg-green-100 p-0.5 rounded-full text-green-800">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          {/* PDF and Translation Container */}
          <div className="flex justify-between gap-4 w-full h-full">
            {/* Original PDF page - fixed width at 0.7 ratio */}
            <div className="min-w-0 h-full">
              <Page
                pageNumber={pageNumber}
                className={`mb-4 page-${pageNumber}`}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={500} // Scale to fit within container with some margin
                onRenderSuccess={() => {
                  const observer = new IntersectionObserver(
                    (entries) => {
                      entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                          setCurrentPage(pageNumber);
                        }
                      });
                    },
                    { threshold: 0.5 }
                  );

                  const element = document.querySelector(`.page-${pageNumber}`);
                  if (element) observer.observe(element);

                  return () => observer.disconnect();
                }}
              />
            </div>

            {/* Translation panel - fixed width at 1.3 ratio */}
            <TranslationPanel
              translation={pageTranslation?.translation}
              visible={showTranslation}
              className="w-full h-full"
            />
          </div>
        </div>
      );
    },
    [translations, showTranslation, setCurrentPage]
  );

  if (!pdfFile) {
    return (
      <div className="flex justify-center items-center bg-white shadow-xs mt-8 p-12 border rounded-lg w-full max-w-3xl">
        <p className="text-gray-500 text-center">
          Please select a PDF file to begin
        </p>
      </div>
    );
  }

  return (
    <div className="size-full">
      <Document
        file={pdfFile}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        className="flex flex-col items-center shadow-none! h-full"
      >
        {/* @ts-ignore */}
        <List
          height={window.innerHeight - 80}
          itemCount={numPages}
          itemSize={980}
          overscanCount={2}
          className="bg-white shadow-xs p-4 rounded-lg w-full"
          ref={listRef}
        >
          {PageRow}
        </List>
      </Document>
    </div>
  );
};

export default PdfViewer;
