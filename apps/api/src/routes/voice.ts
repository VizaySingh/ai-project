import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { detectLanguage } from "../services/language.js";

export const voiceRouter = Router();

const ttsSchema = z.object({
  text: z.string().min(1).max(2500),
  language: z.enum(["hi", "en"]).optional()
});

voiceRouter.post("/tts", async (req, res, next) => {
  try {
    const payload = ttsSchema.parse(req.body);
    const language = payload.language ?? detectLanguage(payload.text);

    if (!config.SARVAM_API_KEY) {
      res.json({
        demo: true,
        language,
        message: "Set SARVAM_API_KEY to return generated audio."
      });
      return;
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": config.SARVAM_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        text: payload.text,
        target_language_code: language === "hi" ? "hi-IN" : "en-IN",
        model: config.SARVAM_TTS_MODEL,
        speaker: language === "hi" ? config.SARVAM_HINDI_SPEAKER : config.SARVAM_ENGLISH_SPEAKER
      })
    });

    if (!response.ok) {
      res.status(response.status).json({ error: await response.text() });
      return;
    }

    const result = (await response.json()) as { audios?: string[] };
    const audio = Buffer.from(result.audios?.[0] ?? "", "base64");
    res.type("audio/wav").send(audio);
  } catch (error) {
    next(error);
  }
});

voiceRouter.get("/realtime-token", (_req, res) => {
  res.json({
    provider: "sarvam-voice",
    note: "Use Sarvam TTS for spoken replies. Add Sarvam STT or browser speech recognition for voice input."
  });
});
