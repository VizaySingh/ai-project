import OpenAI from "openai";
import { config } from "../config.js";
import type { AssistantLanguage } from "./language.js";
import { searchKnowledge } from "./vector-store.js";

const groq = config.GROQ_API_KEY
  ? new OpenAI({
      apiKey: config.GROQ_API_KEY,
      baseURL: config.GROQ_BASE_URL
    })
  : null;

export async function answerQuestion(input: {
  siteId: string;
  question: string;
  language: AssistantLanguage;
  mode: "text" | "voice";
  pageUrl?: string;
}) {
  const context = await searchKnowledge(input.siteId, input.question);
  const languageInstruction =
    input.language === "hi"
      ? "Reply in natural Hindi. Use Devanagari unless the user used Hinglish heavily."
      : "Reply in clear, friendly English.";

  if (!groq) {
    return input.language === "hi"
      ? "Demo mode: Groq API key जोड़ने के बाद मैं वेबसाइट के content, pricing, FAQs और support details के आधार पर पूरा जवाब दूँगी."
      : "Demo mode: add a Groq API key and I will answer from the indexed website content, pricing, FAQs, and support details.";
  }

  const response = await groq.chat.completions.create({
    model: config.GROQ_MODEL,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: [
          "You are a website-specific AI customer support and sales assistant.",
          "Only answer using the supplied website context. If information is missing, say so and offer human handoff.",
          "Never invent prices, plan limits, policies, addresses, phone numbers, timelines, or technical specifications.",
          "If the context names a plan or service but does not include exact pricing or details, say the exact details are not available in the indexed website content.",
          "Prioritize concise helpful answers, lead collection when useful, and safe support guidance.",
          languageInstruction
        ].join(" ")
      },
      {
        role: "user",
        content: `Website context:\n${context || "No indexed context yet."}\n\nVisitor question: ${input.question}`
      }
    ]
  });

  return response.choices[0]?.message.content?.trim() ?? "";
}

export async function embedText(text: string) {
  const vector = new Array<number>(128).fill(0);
  for (const token of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
    }
    vector[hash % vector.length] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}
