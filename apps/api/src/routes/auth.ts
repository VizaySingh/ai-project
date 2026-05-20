import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, signToken, type AuthedRequest } from "../utils/auth.js";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const payload = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        name: payload.name || null,
        passwordHash: await bcrypt.hash(payload.password, 12)
      },
      select: { id: true, email: true, name: true }
    });
    res.json({ token: signToken(user.id), user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.json({ token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  res.json({ user });
});
