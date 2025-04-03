import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import cn from "classnames";

interface TranslationPanelProps {
  translation?: string;
  visible: boolean;
  className?: string;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
  translation,
  visible,
  className,
}) => {
  const [renderedContent, setRenderedContent] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!translation) {
      setRenderedContent(null);
      setRenderError(null);
      return;
    }

    try {
      // Process the translation content if needed
      setRenderedContent(translation);
      setRenderError(null);
    } catch (error) {
      console.error("Error processing translation content:", error);
      setRenderError("Failed to process translation content");
      setRenderedContent(null);
    }
  }, [translation]);

  if (!visible) return null;

  if (renderError) {
    return (
      <div
        className={cn("flex-1 bg-gray-50 overflow-auto p-4", className)}
        dir="rtl"
      >
        <div className="font-medium text-red-500">{renderError}</div>
        <pre className="bg-gray-100 mt-2 p-2 rounded overflow-auto text-xs">
          {translation}
        </pre>
      </div>
    );
  }

  if (!renderedContent) return null;

  return (
    <div className={cn("flex-1 bg-gray-50 overflow-auto", className)} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug]}
        className={cn(
          "prose max-w-none p-4 text-sm md:text-base lg:text-lg",
          "font-[Vazirmatn] prose-headings:font-[Vazirmatn] prose-p:font-[Vazirmatn]",
          "prose-h1:font-bold prose-h1:text-lg prose-h1:my-2 prose-h2:text-sm",
          "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
          "prose-p:my-1 prose-p:leading-snug",
          "prose-li:my-0 prose-li:leading-snug",
          "prose-ol:my-1 prose-ol:space-y-0",
          "prose-ul:my-1 prose-ul:space-y-0",
          "prose-blockquote:bg-gray-50 prose-blockquote:shadow-sm prose-blockquote:p-4",
          "prose-blockquote:border-gray-300 prose-blockquote:border-l-4 prose-blockquote:rounded-lg",
          "[&>*]:my-1 prose-stone"
        )}
        components={{
          // Custom error boundary for Markdown components
          p: ({ node, ...props }) => {
            try {
              return <p {...props} />;
            } catch (error) {
              console.error("Error rendering paragraph:", error);
              return <p className="text-red-500">Error rendering content</p>;
            }
          },
        }}
      >
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
};

export default TranslationPanel;
