"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { FixedSizeList as List } from "react-window";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { GlobalWorkerOptions } from "pdfjs-dist";
import useOai from "../../hooks/oai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import "@fontsource/vazirmatn";
import "@fontsource/vazirmatn/300";
import "@fontsource/vazirmatn/500";
import "@fontsource/vazirmatn/600";
import "@fontsource/vazirmatn/700";
import "@fontsource/vazirmatn/800";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Define type for translation cache
interface TranslationCache {
  [filename: string]: {
    language: string;
    translations: {
      [page: number]: {
        content: string;
        translation: string;
        status: "idle" | "translating" | "completed";
      };
    };
  };
}

const BooksBoard = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [translations, setTranslations] = useState<{
    [page: number]: {
      content: string;
      translation: string;
      status: "idle" | "translating" | "completed";
    };
  }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState<string>("Persian");
  const { getOai, model } = useOai();

  // Load translations from cache when file is loaded
  useEffect(() => {
    if (pdfFile && fileName) {
      loadTranslationsFromCache();
    }
  }, [pdfFile, fileName, targetLanguage]);

  // Save translations to cache whenever they change
  useEffect(() => {
    if (pdfFile && fileName && Object.keys(translations).length > 0) {
      saveTranslationsToCache();
    }
  }, [translations, fileName, targetLanguage]);

  const saveTranslationsToCache = () => {
    try {
      const cacheKey = "pdf-translations-cache";
      const existingCache = localStorage.getItem(cacheKey);
      let cache: TranslationCache = existingCache
        ? JSON.parse(existingCache)
        : {};

      // Update cache with current translations
      cache[fileName] = {
        language: targetLanguage,
        translations: translations,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cache));
      console.log("Translations saved to cache");
    } catch (error) {
      console.error("Failed to save translations to cache:", error);
    }
  };

  const loadTranslationsFromCache = () => {
    try {
      const cacheKey = "pdf-translations-cache";
      const existingCache = localStorage.getItem(cacheKey);

      if (existingCache) {
        const cache: TranslationCache = JSON.parse(existingCache);

        if (cache[fileName] && cache[fileName].language === targetLanguage) {
          setTranslations(cache[fileName].translations);
          console.log("Translations loaded from cache");

          // Update progress based on loaded translations
          if (numPages > 0) {
            const completedPages = Object.values(
              cache[fileName].translations
            ).filter((t) => t.status === "completed").length;
            setTranslationProgress(
              Math.round((completedPages / numPages) * 100)
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to load translations from cache:", error);
    }
  };

  const clearTranslationsCache = () => {
    try {
      if (
        window.confirm(
          "Are you sure you want to clear all cached translations?"
        )
      ) {
        localStorage.removeItem("pdf-translations-cache");
        setTranslations({});
        setTranslationProgress(0);
        console.log("Translations cache cleared");
      }
    } catch (error) {
      console.error("Failed to clear translations cache:", error);
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

  useEffect(() => {
    // Update translation progress
    if (numPages > 0) {
      const completedPages = Object.values(translations).filter(
        (t) => t.status === "completed"
      ).length;
      setTranslationProgress(Math.round((completedPages / numPages) * 100));
    }
  }, [translations, numPages]);

  useEffect(() => {
    // Auto-translate logic
    if (autoTranslate && numPages > 0) {
      const pagesToTranslate = [currentPage];

      // Add pages ahead for pre-translation
      if (currentPage + 1 <= numPages) pagesToTranslate.push(currentPage + 1);
      if (currentPage + 2 <= numPages) pagesToTranslate.push(currentPage + 2);

      pagesToTranslate.forEach((page) => {
        if (!translations[page] || translations[page].status === "idle") {
          translatePage(page);
        }
      });
    }
  }, [currentPage, autoTranslate, numPages]);

  // Add new function to extract structured content from page
  const extractStructuredContent = (pageElement: Element): any => {
    const textElements = Array.from(
      pageElement.querySelectorAll(".textLayer > span")
    );

    if (textElements.length === 0) return { type: "empty" };

    // Group text elements by their vertical position to identify paragraphs
    const lineGroups: { [key: string]: string[] } = {};
    textElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const key = Math.round(rect.top);
      if (!lineGroups[key]) lineGroups[key] = [];
      if (el.textContent) lineGroups[key].push(el.textContent.trim());
    });

    // Convert to structured format
    const structure = Object.entries(lineGroups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([_, texts]) => {
        const line = texts.join(" ").trim();
        // Detect if this might be a heading based on length
        if (line.length < 100 && line.endsWith(".") === false) {
          return { type: "heading", content: line };
        }
        return { type: "paragraph", content: line };
      })
      .filter((item) => item.content.length > 0);

    return structure;
  };

  const translatePage = async (pageNumber: number) => {
    // Skip if already translating or completed
    if (
      translations[pageNumber]?.status === "translating" ||
      translations[pageNumber]?.status === "completed"
    ) {
      return;
    }

    // Mark page as translating
    setTranslations((prev) => ({
      ...prev,
      [pageNumber]: {
        ...(prev[pageNumber] || { content: "", translation: "" }),
        status: "translating",
      },
    }));

    try {
      const pageElement = document.querySelector(`.page-${pageNumber}`);
      if (!pageElement) {
        // Reset status if page element not found
        setTranslations((prev) => ({
          ...prev,
          [pageNumber]: {
            ...(prev[pageNumber] || { content: "", translation: "" }),
            status: "idle",
          },
        }));
        return;
      }

      // Extract structured content instead of raw text
      const structuredContent = extractStructuredContent(pageElement);

      if (
        structuredContent.length === 0 ||
        structuredContent.type === "empty"
      ) {
        // Reset status if no content
        setTranslations((prev) => ({
          ...prev,
          [pageNumber]: {
            ...(prev[pageNumber] || { content: "", translation: "" }),
            status: "idle",
          },
        }));
        return;
      }

      // Save the raw content for reference
      const pageContent = structuredContent
        .map((item) => item.content)
        .join("\n\n");

      const oai = getOai();
      const response = await oai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following structured text to ${targetLanguage} in markdown format. Keep the translation natural and maintain the original structure and meaning. Headings should remain as headings in the output.`,
          },
          {
            role: "user",
            content: pageContent,
          },
        ],
      });

      const translation = response.choices[0]?.message?.content;
      console.log("Translation response:", translation);

      if (translation) {
        setTranslations((prev) => ({
          ...prev,
          [pageNumber]: {
            content: pageContent,
            translation,
            status: "completed",
          },
        }));
      }
    } catch (error) {
      console.error(`Translation error for page ${pageNumber}:`, error);
      // Reset status on error
      setTranslations((prev) => ({
        ...prev,
        [pageNumber]: {
          ...(prev[pageNumber] || { content: "", translation: "" }),
          status: "idle",
        },
      }));
    }
  };

  const handleTranslate = () => {
    translatePage(currentPage);
  };

  const PageRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
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

          {/* Original PDF page */}
          <div className="min-w-0 h-full">
            <Page
              pageNumber={pageNumber}
              className={`mb-4 page-${pageNumber}`}
              _className="w-1/2"
              renderTextLayer={true}
              renderAnnotationLayer={true}
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

          {/* Translation panel */}
          {pageTranslation?.translation && showTranslation && (
            <div
              className="flex-1 bg-gray-50 p-2 w-1/2 overflow-auto"
              dir="rtl"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug]}
                className="prose-ol:space-y-0 prose-ul:space-y-0 prose-blockquote:bg-gray-50 prose-blockquote:shadow-sm [&>*]:my-1 prose-h1:my-2 prose-li:my-0 prose-ol:my-1 prose-p:my-1 prose-ul:my-1 p-2 prose-blockquote:p-4 prose-blockquote:border-gray-300 prose-blockquote:border-l-4 prose-blockquote:rounded-lg max-w-none font-[Vazirmatn] prose-headings:font-[Vazirmatn] prose-p:font-[Vazirmatn] prose-h1:font-bold prose-a:text-blue-600 text-sm md:text-base lg:text-lg prose-h1:text-lg hover:prose-a:underline prose-a:no-underline prose-li:leading-snug prose-p:leading-snug prose prose-stone"
              >
                {pageTranslation.translation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      );
    },
    [translations, showTranslation]
  );

  return (
    <div
      className="relative flex flex-col gap-6 mx-auto overflow-hidden container"
      style={{ height: "100vh" }}
    >
      {/* Floating control panel in top right */}
      <div className="top-2 right-2 z-50 fixed flex flex-col gap-2">
        <div className="flex flex-col gap-3 bg-white shadow-lg p-3 border rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            {/* File selector */}
            <label className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-sm text-white text-sm cursor-pointer">
              Select PDF
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Page counter */}
            {numPages > 0 && (
              <div className="bg-gray-200 px-3 py-1 rounded-sm text-sm">
                {currentPage}/{numPages}
              </div>
            )}

            {/* Translation controls */}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded-sm text-white text-sm"
            >
              {showTranslation ? "Hide" : "Show"}
            </button>

            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`px-3 py-1 rounded text-white text-sm ${
                isTranslating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              Translate
            </button>

            {/* Language selector */}
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-white px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="Persian">Persian</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Spanish">Spanish</option>
            </select>

            {/* Auto-translate toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm">Auto:</label>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  autoTranslate ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    autoTranslate ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Clear cache button */}
            <button
              onClick={clearTranslationsCache}
              className="flex items-center bg-red-500 hover:bg-red-600 px-2 py-1 rounded-sm text-white text-xs"
              title="Clear cached translations"
            >
              <svg
                className="mr-1 w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/200/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Cache
            </button>
          </div>
        </div>
      </div>

      <div className="top-16 absolute flex flex-col flex-1 items-center gap-4 w-full">
        {pdfFile ? (
          <div className="size-full">
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="flex flex-col items-center shadow-none! h-full"
            >
              <List
                height={window.innerHeight - 80}
                itemCount={numPages}
                itemSize={980}
                width={
                  window.innerWidth > 1200
                    ? 1180
                    : window.innerWidth > 768
                    ? 980
                    : window.innerWidth - 48
                }
                overscanCount={2}
                className="bg-white shadow-xs p-4 rounded-lg"
              >
                {PageRow}
              </List>
            </Document>
          </div>
        ) : (
          <div className="flex justify-center items-center bg-white shadow-xs mt-8 p-12 border rounded-lg w-full max-w-3xl">
            <p className="text-gray-500 text-center">
              Please select a PDF file to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksBoard;
