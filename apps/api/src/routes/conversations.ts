import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../utils/auth.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

conversationsRouter.get("/:siteId", async (req, res, next) => {
  try {
    const user = (req as unknown as AuthedRequest).user;
    const siteId = String(req.params.siteId);
    const site = await prisma.site.findFirst({ where: { id: siteId, ownerId: user.id } });
    if (!site) {
      res.status(404).json({ error: "Site not found" });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 12
        }
      }
    });

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});
