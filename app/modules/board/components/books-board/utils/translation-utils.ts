// Define types for translation system
export interface ContentItem {
  type: "heading" | "paragraph" | "empty";
  content: string;
}

export interface TranslationCache {
  [filename: string]: {
    language: string;
    translations: TranslationData;
  };
}

export interface TranslationData {
  [page: number]: {
    content: string;
    translation: string;
    status: "idle" | "translating" | "completed";
  };
}

// Queue to manage translation requests
const translationQueue: {
  pageNumber: number;
  promise: Promise<string | null>;
}[] = [];
let isProcessingQueue = false;

// Function to extract structured content from page
export const extractStructuredContent = (
  pageElement: Element
): ContentItem[] | ContentItem => {
  const textElements = Array.from(
    pageElement.querySelectorAll(".textLayer > span")
  );

  if (textElements.length === 0) return { type: "empty", content: "" };

  // Group text elements by their vertical position to identify paragraphs
  const lineGroups: { [key: string]: string[] } = {};
  textElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const key = Math.round(rect.top).toString();
    if (!lineGroups[key]) lineGroups[key] = [];
    if (el.textContent) lineGroups[key].push(el.textContent.trim());
  });

  // Convert to structured format
  return Object.entries(lineGroups)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, texts]) => {
      const line = texts.join(" ").trim();
      // Detect if this might be a heading based on length and ending
      const type: "heading" | "paragraph" =
        line.length < 100 && !line.endsWith(".") ? "heading" : "paragraph";
      return {
        type,
        content: line,
      };
    })
    .filter((item) => item.content.length > 0);
};

// Reset in-progress translations
export const resetInProgressTranslations = (translations: TranslationData): TranslationData => {
  const newTranslations = { ...translations };
  for (const page in newTranslations) {
    if (newTranslations[page].status === "translating") {
      newTranslations[page].status = "idle";
    }
  }
  return newTranslations;
};

// Cache management functions
const CACHE_KEY = "pdf-translations-cache";

export const saveTranslationsToCache = (
  fileName: string,
  targetLanguage: string,
  translations: TranslationData
): void => {
  try {
    const existingCache = localStorage.getItem(CACHE_KEY);
    let cache: TranslationCache = existingCache
      ? JSON.parse(existingCache)
      : {};

    cache[fileName] = { language: targetLanguage, translations };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log("Translations saved to cache");
  } catch (error) {
    console.error("Failed to save translations to cache:", error);
  }
};

export const loadTranslationsFromCache = (
  fileName: string,
  targetLanguage: string
): TranslationData | null => {
  try {
    const existingCache = localStorage.getItem(CACHE_KEY);
    if (!existingCache) return null;

    const cache: TranslationCache = JSON.parse(existingCache);
    const entry = cache[fileName];

    if (entry?.language === targetLanguage) {
      console.log("Translations loaded from cache");
      return entry.translations;
    }
    return null;
  } catch (error) {
    console.error("Failed to load translations from cache:", error);
    return null;
  }
};

export const clearTranslationsCache = (): boolean => {
  if (
    window.confirm("Are you sure you want to clear all cached translations?")
  ) {
    localStorage.removeItem(CACHE_KEY);
    console.log("Translations cache cleared");
    return true;
  }
  return false;
};

// Process the translation queue
const processTranslationQueue = async (
  translations: TranslationData,
  updateTranslations: (data: TranslationData) => void,
  getOai: () => any,
  model: string,
  targetLanguage: string
): Promise<void> => {
  if (isProcessingQueue || translationQueue.length === 0) return;

  isProcessingQueue = true;

  try {
    // Process all current items in parallel while maintaining state
    const currentBatch = [...translationQueue];
    translationQueue.length = 0; // Clear the queue

    await Promise.all(
      currentBatch.map(async (item) => {
        try {
          await item.promise;
        } catch (error) {
          console.error(
            `Error processing translation for page ${item.pageNumber}:`,
            error
          );
        }
      })
    );

    // Process any new items that were added during translation
    isProcessingQueue = false;
    if (translationQueue.length > 0) {
      processTranslationQueue(
        translations,
        updateTranslations,
        getOai,
        model,
        targetLanguage
      );
    }
  } catch (error) {
    console.error("Error processing translation queue:", error);
    isProcessingQueue = false;
    if (translationQueue.length > 0) {
      processTranslationQueue(
        translations,
        updateTranslations,
        getOai,
        model,
        targetLanguage
      );
    }
  }
};

// Update translations helper with atomic updates
const updateTranslationStatus = (
  pageNumber: number,
  translations: TranslationData,
  updateTranslations: (data: TranslationData) => void,
  status: "idle" | "translating" | "completed",
  translation?: string,
  content?: string
): void => {
  // Create an update function with proper types
  const newTranslations: TranslationData = {
    ...translations,
    [pageNumber]: {
      content: content || translations[pageNumber]?.content || "",
      translation: translation || translations[pageNumber]?.translation || "",
      status,
    },
  };

  // Call the update function with the new translations object
  updateTranslations(newTranslations);
};

// Function to translate a page
export const translatePage = async (
  pageNumber: number,
  translations: TranslationData,
  updateTranslations: (data: TranslationData) => void,
  getOai: () => any,
  model: string,
  targetLanguage: string
): Promise<string | null> => {
  // Skip if already translating or completed
  if (
    translations[pageNumber]?.status === "translating" ||
    translations[pageNumber]?.status === "completed"
  ) {
    return translations[pageNumber]?.translation || null;
  }

  // Mark page as translating
  updateTranslationStatus(
    pageNumber,
    translations,
    updateTranslations,
    "translating"
  );

  // Create a promise for this translation task
  const translationPromise = new Promise<string | null>(
    async (resolve, reject) => {
      try {
        const pageElement = document.querySelector(`.page-${pageNumber}`);
        if (!pageElement) {
          updateTranslationStatus(
            pageNumber,
            translations,
            updateTranslations,
            "idle"
          );
          resolve(null);
          return;
        }

        // Extract structured content
        const structuredContent = extractStructuredContent(pageElement);

        if (
          (Array.isArray(structuredContent) &&
            structuredContent.length === 0) ||
          (!Array.isArray(structuredContent) &&
            structuredContent.type === "empty")
        ) {
          updateTranslationStatus(
            pageNumber,
            translations,
            updateTranslations,
            "idle"
          );
          resolve(null);
          return;
        }

        // Prepare content for translation
        const contentItems = Array.isArray(structuredContent)
          ? structuredContent
          : [structuredContent];

        const pageContent = contentItems
          .map((item) => item.content)
          .join("\n\n");

        const oai = getOai();
        const response = await oai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text to ${targetLanguage} in markdown format (only basic stuff header,list,text). Keep the translation natural and maintain the original structure and meaning. if there was subtle mistakes fix it, to output should structured and easily readable.`,
            },
            {
              role: "user",
              content: pageContent,
            },
          ],
        });

        const translation = response.choices[0]?.message?.content;
        console.log(
          `Translation response for page ${pageNumber}:`,
          translation
        );

        if (translation) {
          updateTranslationStatus(
            pageNumber,
            translations,
            updateTranslations,
            "completed",
            translation,
            pageContent
          );
        }
        resolve(translation || null);
      } catch (error) {
        console.error(`Translation error for page ${pageNumber}:`, error);
        updateTranslationStatus(
          pageNumber,
          translations,
          updateTranslations,
          "idle"
        );
        reject(error);
      }
    }
  );

  // Add to queue and start processing if not already
  translationQueue.push({ pageNumber, promise: translationPromise });

  if (!isProcessingQueue) {
    processTranslationQueue(
      translations,
      updateTranslations,
      getOai,
      model,
      targetLanguage
    );
  }

  return translationPromise;
};
