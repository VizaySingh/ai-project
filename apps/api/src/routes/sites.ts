import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../utils/auth.js";

export const siteRouter = Router();

const siteSchema = z.object({
  name: z.string().min(2),
  domain: z.string().min(3),
  assistantName: z.string().default("Asha AI"),
  voiceEnabled: z.boolean().default(true),
  languages: z.array(z.enum(["hi", "en"])).default(["hi", "en"]),
  theme: z.enum(["dark", "light", "auto"]).default("dark")
});

siteRouter.use(requireAuth);

siteRouter.get("/", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const sites = await prisma.site.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { conversations: true, pages: true, chunks: true, events: true }
        }
      }
    });
    res.json({ sites: sites.map(withEmbedCode) });
  } catch (error) {
    next(error);
  }
});

siteRouter.post("/", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const payload = siteSchema.parse(req.body);
    const site = await prisma.site.create({
      data: {
        ownerId: user.id,
        name: payload.name,
        domain: payload.domain,
        assistantName: payload.assistantName,
        voiceEnabled: payload.voiceEnabled,
        languages: payload.languages.join(","),
        theme: payload.theme
      },
      include: {
        _count: {
          select: { conversations: true, pages: true, chunks: true, events: true }
        }
      }
    });
    res.status(201).json({
      site: withEmbedCode(site)
    });
  } catch (error) {
    next(error);
  }
});

siteRouter.get("/:siteId", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, ownerId: user.id },
      include: {
        _count: {
          select: { conversations: true, pages: true, chunks: true, events: true }
        }
      }
    });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    res.json({ site: withEmbedCode(site) });
  } catch (error) {
    next(error);
  }
});

siteRouter.patch("/:siteId", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const payload = siteSchema.partial().parse(req.body);
    const existing = await prisma.site.findFirst({ where: { id: req.params.siteId, ownerId: user.id } });
    if (!existing) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    const { languages, ...otherData } = payload;
    const updateData = {
      ...otherData,
      ...(languages ? { languages: languages.join(",") } : {})
    };
    const site = await prisma.site.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        _count: {
          select: { conversations: true, pages: true, chunks: true, events: true }
        }
      }
    });
    res.json({ site: withEmbedCode(site) });
  } catch (error) {
    next(error);
  }
});

function withEmbedCode<T extends { id: string; languages?: string | string[] }>(site: T) {
  return {
    ...site,
    languages: typeof site.languages === "string" ? site.languages.split(",") : (site.languages ?? ["hi", "en"]),
    embedCode: `<script async src="${config.API_BASE_URL}/embed/assistant.js" data-site-id="${site.id}"></script>`
  };
}
