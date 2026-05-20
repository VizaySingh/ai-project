export function chunkText(text: string, maxChars = 1200) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < cleaned.length) {
    const slice = cleaned.slice(cursor, cursor + maxChars);
    const boundary = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("। "));
    const end = boundary > 400 ? cursor + boundary + 1 : cursor + slice.length;
    chunks.push(cleaned.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks.filter(Boolean);
}
