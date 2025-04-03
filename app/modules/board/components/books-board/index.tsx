"use client";
import { useState, useCallback, useEffect } from "react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { GlobalWorkerOptions } from "pdfjs-dist";
import useOai from "../../hooks/oai";
import "@fontsource/vazirmatn";
import "@fontsource/vazirmatn/300";
import "@fontsource/vazirmatn/500";
import "@fontsource/vazirmatn/600";
import "@fontsource/vazirmatn/700";
import "@fontsource/vazirmatn/800";
import ControlPanel from "./components/control-panel";
import SidePanel from "./components/side-panel";
import {
  saveTranslationsToCache,
  loadTranslationsFromCache,
  clearTranslationsCache,
  translatePage,
  resetInProgressTranslations,
  type TranslationData,
} from "./utils/translation-utils";
import PdfViewer from "./components/pdf-viewer";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Extend Window interface to include our custom property
declare global {
  interface Window {
    pdfListRef: any;
  }
}

const BooksBoard = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState<string>("Persian");
  const { getOai, model } = useOai();

  // Add reference to the List component
  const listRef = useCallback((node: any) => {
    if (node !== null) {
      window.pdfListRef = node;
    }
  }, []);

  // Load translations from cache when file is loaded
  useEffect(() => {
    if (pdfFile && fileName) {
      const cachedTranslations = loadTranslationsFromCache(
        fileName,
        targetLanguage
      );
      if (cachedTranslations) {
        const resetTranslations =
          resetInProgressTranslations(cachedTranslations);
        setTranslations(resetTranslations);

        // Update progress based on loaded translations
        if (numPages > 0) {
          const completedPages = Object.values(resetTranslations).filter(
            (t) => t.status === "completed"
          ).length;
          setTranslationProgress(Math.round((completedPages / numPages) * 100));
        }
      }
    }
  }, [pdfFile, fileName, targetLanguage, numPages]);

  // Save translations to cache when component unmounts or when file changes
  useEffect(() => {
    if (pdfFile && fileName && Object.keys(translations).length > 0) {
      // Use a delayed save to reduce frequency of updates
      const saveTranslations = () => {
        // Only completed translations will be saved due to filter in saveTranslationsToCache
        saveTranslationsToCache(fileName, targetLanguage, translations);
      };

      // Batch save to reduce localStorage writes
      const timeoutId = setTimeout(saveTranslations, 5000);

      return () => {
        clearTimeout(timeoutId);
        // Always save on unmount
        saveTranslations();
      };
    }
  }, [translations, fileName, targetLanguage, pdfFile]);

  // Reduced frequency updates for translation progress
  useEffect(() => {
    if (numPages > 0) {
      const calculateProgress = () => {
        const completedPages = Object.values(translations).filter(
          (t) => t.status === "completed"
        ).length;
        setTranslationProgress(Math.round((completedPages / numPages) * 100));
      };

      const timeoutId = setTimeout(calculateProgress, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [translations, numPages]);

  // Improved auto-translate logic with better state management
  useEffect(() => {
    if (!autoTranslate || numPages === 0) return;

    const translatePages = async () => {
      const pagesToTranslate = new Set([currentPage]);

      // Add pages ahead for pre-translation
      if (currentPage + 1 <= numPages) pagesToTranslate.add(currentPage + 1);
      if (currentPage + 2 <= numPages) pagesToTranslate.add(currentPage + 2);

      // Create a new translations object for atomic updates
      const newTranslations = { ...translations };

      // Process pages in sequence to maintain state
      for (const page of pagesToTranslate) {
        if (
          newTranslations[page]?.status === "completed" ||
          newTranslations[page]?.status === "translating"
        ) {
          continue;
        }

        try {
          await handleTranslatePage(page);
        } catch (error) {
          console.error(`Failed to translate page ${page}:`, error);
        }
      }
    };

    translatePages();
  }, [currentPage, autoTranslate, numPages]);

  const handleClearTranslationsCache = () => {
    if (clearTranslationsCache()) {
      setTranslations({});
      setTranslationProgress(0);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setFileName(file.name);
      // Reset translations when new file is loaded
      setTranslations({});
      setTranslationProgress(0);
    }
  };

  const handleTranslatePage = async (pageNumber: number) => {
    // Only set isTranslating for the current page to avoid UI flicker
    if (pageNumber === currentPage) {
      setIsTranslating(true);
    }

    try {
      await translatePage(
        pageNumber,
        translations,
        setTranslations,
        getOai,
        model,
        targetLanguage
      );
    } finally {
      // Only reset isTranslating if we were translating the current page
      if (pageNumber === currentPage) {
        setIsTranslating(false);
      }
    }
  };

  const handleTranslate = () => {
    handleTranslatePage(currentPage);
  };

  return (
    <div
      className="relative flex flex-col gap-6 mx-auto max-w-5xl overflow-hidden container"
      style={{ height: "100vh" }}
    >
      {/* Control Panel */}
      <ControlPanel
        onFileChange={handleFileChange}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
        handleTranslate={handleTranslate}
        isTranslating={isTranslating}
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
        autoTranslate={autoTranslate}
        setAutoTranslate={setAutoTranslate}
        clearTranslationsCache={handleClearTranslationsCache}
      />

      {/* Side Panel */}
      {pdfFile && numPages > 0 && (
        <SidePanel
          numPages={numPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          translations={translations}
        />
      )}

      {/* Main PDF Viewer */}
      <div className="top-16 absolute flex flex-col flex-1 items-center gap-4 w-full">
        <PdfViewer
          pdfFile={pdfFile}
          numPages={numPages}
          setNumPages={setNumPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          translations={translations}
          showTranslation={showTranslation}
          listRef={listRef}
        />
      </div>
    </div>
  );
};

export default BooksBoard;
