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

  // Find the first '{' or '['
  const firstOpenBrace = content.indexOf("{");
  const firstOpenBracket = content.indexOf("[");

  // Determine if the first JSON structure is an object or an array
  let startIndex = -1;
  let endIndex = -1;

  if (
    firstOpenBrace !== -1 &&
    (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)
  ) {
    // JSON object case
    startIndex = firstOpenBrace;
    endIndex = content.lastIndexOf("}");
  } else if (firstOpenBracket !== -1) {
    // JSON array case
    startIndex = firstOpenBracket;
    endIndex = content.lastIndexOf("]");
  }

  // Check if valid start and end indices exist
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const jsonString = content.substring(startIndex, endIndex + 1);

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
