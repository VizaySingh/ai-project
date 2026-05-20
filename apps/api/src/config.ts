import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("dev-secret-change-me"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
  SARVAM_API_KEY: z.string().optional(),
  SARVAM_TTS_MODEL: z.string().default("bulbul:v3"),
  SARVAM_HINDI_SPEAKER: z.string().default("priya"),
  SARVAM_ENGLISH_SPEAKER: z.string().default("shubh"),
  DEEPGRAM_API_KEY: z.string().optional()
});

export const config = envSchema.parse(process.env);
