import stripJsonComments from "strip-json-comments";

const cleanJson = (text: string) => {
  // Use a regular expression to match text between ```json and ``` (if it exists)
  const match = text.match(/```(json|)([\s\S]*?)```/);

  // If a match is found, return the extracted JSON part trimmed of whitespace, otherwise return the original text
  return stripJsonComments(match ? match[2].trim() : text);
};

export function extractFirstJson(content: string) {
  content = cleanJson(content);
  content = content.replace(new RegExp("```json", "g"), "");
  content = content.replace(new RegExp("```", "g"), "");
  // Find the first '{' and the last '}'
  const firstOpenBrace = content.indexOf("{");
  const lastCloseBrace = content.lastIndexOf("}");

  // Check if braces exist
  if (
    firstOpenBrace !== -1 &&
    lastCloseBrace !== -1 &&
    lastCloseBrace > firstOpenBrace
  ) {
    const jsonString = content.substring(firstOpenBrace, lastCloseBrace + 1);

    try {
      // Try parsing to ensure it's valid JSON
      const parsedJson = JSON.parse(jsonString);
      return parsedJson;
    } catch (error) {
      console.error("Invalid JSON:", error);
      return null;
    }
  }

  return null;
}
