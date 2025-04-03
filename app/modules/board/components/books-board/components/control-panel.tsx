import React from "react";

interface ControlPanelProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showTranslation: boolean;
  setShowTranslation: (show: boolean) => void;
  handleTranslate: () => void;
  isTranslating: boolean;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  autoTranslate: boolean;
  setAutoTranslate: (auto: boolean) => void;
  clearTranslationsCache: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileChange,
  showTranslation,
  setShowTranslation,
  handleTranslate,
  isTranslating,
  targetLanguage,
  setTargetLanguage,
  autoTranslate,
  setAutoTranslate,
  clearTranslationsCache,
}) => {
  return (
    <div className="top-2 right-2 z-50 fixed flex flex-col gap-2">
      <div className="flex flex-col gap-3 bg-white shadow-lg p-3 border rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* File selector */}
          <label className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-sm text-white text-sm cursor-pointer">
            Select PDF
            <input
              type="file"
              accept=".pdf"
              onChange={onFileChange}
              className="hidden"
            />
          </label>

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
  );
};

export default ControlPanel;
