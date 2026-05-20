import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { chunkText } from "../services/chunker.js";
import { upsertKnowledge } from "../services/vector-store.js";
import { requireAuth, type AuthedRequest } from "../utils/auth.js";

export const trainingRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const textSchema = z.object({
  siteId: z.string().min(3),
  title: z.string().optional(),
  text: z.string().min(1)
});

trainingRouter.use(requireAuth);

trainingRouter.post("/text", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const payload = textSchema.parse(req.body);
    const site = await prisma.site.findFirst({ where: { id: payload.siteId, ownerId: user.id } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    await upsertKnowledge({
      siteId: payload.siteId,
      title: payload.title ?? "Manual training",
      chunks: chunkText(payload.text)
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

trainingRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const siteId = String(req.body.siteId ?? "");
    if (!siteId || !req.file) throw new Error("siteId and file are required");
    const site = await prisma.site.findFirst({ where: { id: siteId, ownerId: user.id } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }
    const text = req.file.buffer.toString("utf8");
    await prisma.upload.create({
      data: {
        siteId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype || "application/octet-stream"
      }
    });
    await upsertKnowledge({
      siteId,
      title: req.file.originalname,
      chunks: chunkText(text)
    });
    res.json({ ok: true, filename: req.file.originalname });
  } catch (error) {
    next(error);
  }
});
