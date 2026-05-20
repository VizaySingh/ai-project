import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { crawlWebsite, indexPage } from "../services/crawler.js";
import { requireAuth, type AuthedRequest } from "../utils/auth.js";

export const crawlRouter = Router();

const pageSchema = z.object({
  siteId: z.string().min(3),
  url: z.string().url(),
  title: z.string().optional(),
  text: z.string().min(1),
  links: z.array(z.string().url()).optional()
});

const crawlSchema = z.object({
  siteId: z.string().min(3),
  startUrl: z.string().url(),
  maxPages: z.number().int().min(1).max(100).optional()
});

crawlRouter.post("/page", async (req, res, next) => {
  try {
    const payload = pageSchema.parse(req.body);
    const site = await prisma.site.findUnique({ where: { id: payload.siteId } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    await indexPage(payload);
    res.json({ ok: true, indexed: payload.url });
  } catch (error) {
    next(error);
  }
});

crawlRouter.post("/site", requireAuth, async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const payload = crawlSchema.parse(req.body);
    const site = await prisma.site.findFirst({ where: { id: payload.siteId, ownerId: user.id } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    const indexed = await crawlWebsite(payload);
    res.json({ ok: true, indexed });
  } catch (error) {
    next(error);
  }
});
