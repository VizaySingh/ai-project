import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { answerQuestion } from "../services/ai.js";
import { detectLanguage } from "../services/language.js";

export const chatRouter = Router();

const chatSchema = z.object({
  siteId: z.string().min(3),
  message: z.string().min(1).max(4000),
  pageUrl: z.string().url().optional(),
  mode: z.enum(["text", "voice"]).default("text"),
  visitorId: z.string().optional(),
  conversationId: z.string().optional()
});

chatRouter.post("/", async (req, res, next) => {
  try {
    const payload = chatSchema.parse(req.body);
    
    if (payload.siteId === "demo") {
      const language = detectLanguage(payload.message);
      const answer = await answerQuestion({
        siteId: "demo",
        question: payload.message,
        language,
        mode: payload.mode,
        pageUrl: payload.pageUrl
      });
      res.json({ answer, language, mode: payload.mode, conversationId: "demo-conv" });
      return;
    }

    const site = await prisma.site.findUnique({ where: { id: payload.siteId } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    const language = detectLanguage(payload.message);
    const conversation = payload.conversationId
      ? await prisma.conversation.findFirst({ where: { id: payload.conversationId, siteId: payload.siteId } })
      : await prisma.conversation.create({
          data: {
            siteId: payload.siteId,
            visitorId: payload.visitorId ?? crypto.randomUUID(),
            language,
            mode: payload.mode
          }
        });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: payload.message }
    });

    const answer = await answerQuestion({
      siteId: payload.siteId,
      question: payload.message,
      language,
      mode: payload.mode,
      pageUrl: payload.pageUrl
    });

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer }
    });
    await prisma.visitorEvent.create({
      data: { siteId: payload.siteId, type: "chat_started", pageUrl: payload.pageUrl }
    });

    res.json({ answer, language, mode: payload.mode, conversationId: conversation.id });
  } catch (error) {
    next(error);
  }
});
