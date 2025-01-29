const extractXMLContent = (content: string, tag?: string): string | null => {
  if (!tag) return null;
  const match = content.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));

  if (match && match[1]) {
    return `<${tag}>${match[1].trim()}</${tag}>`;
  }
  return null;
};
const xmlParse = (content: string, parentTag: string) => {
  const xmlContent = extractXMLContent(content, parentTag);
  console.log("xmlContent", xmlContent);

  if (!xmlContent) {
    return null;
  }
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
  return xmlDoc.getElementsByTagName(parentTag)[0];
};

export { extractXMLContent, xmlParse };
