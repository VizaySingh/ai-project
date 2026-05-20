export type AssistantLanguage = "hi" | "en";

const devanagari = /[\u0900-\u097F]/;
const hindiHints = /\b(kya|hai|hain|mujhe|batao|kaise|kitna|mein|nahi|aap|price|pricing)\b/i;

export function detectLanguage(input: string): AssistantLanguage {
  if (devanagari.test(input) || hindiHints.test(input)) return "hi";
  return "en";
}
