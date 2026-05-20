import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../utils/auth.js";

export const analyticsRouter = Router();

const eventSchema = z.object({
  siteId: z.string(),
  type: z.string(),
  pageUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional()
});

analyticsRouter.post("/event", async (req, res, next) => {
  try {
    const event = eventSchema.parse(req.body);
    await prisma.visitorEvent.create({
      data: {
        siteId: event.siteId,
        type: event.type,
        pageUrl: event.pageUrl,
        metadata: event.metadata as Prisma.InputJsonValue | undefined
      }
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

analyticsRouter.get("/:siteId/summary", requireAuth, async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const siteId = String(req.params.siteId);
    const site = await prisma.site.findFirst({ where: { id: siteId, ownerId: user.id } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }

    const [visitorsAssisted, leads, voiceSessions, events, conversations, pages, chunks] = await Promise.all([
      prisma.visitorEvent.count({ where: { siteId: site.id, type: "chat_started" } }),
      prisma.visitorEvent.count({ where: { siteId: site.id, type: "lead_captured" } }),
      prisma.visitorEvent.count({ where: { siteId: site.id, type: "voice_started" } }),
      prisma.visitorEvent.findMany({ where: { siteId: site.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.conversation.count({ where: { siteId: site.id } }),
      prisma.page.count({ where: { siteId: site.id } }),
      prisma.knowledgeChunk.count({ where: { siteId: site.id } })
    ]);

    res.json({ visitorsAssisted, leads, voiceSessions, conversations, pages, chunks, events });
  } catch (error) {
    next(error);
  }
});
