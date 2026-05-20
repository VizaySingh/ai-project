import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { HttpError } from "./errors.js";

const tokenSchema = z.object({ sub: z.string() });

export type AuthedRequest = Parameters<RequestHandler>[0] & {
  user: {
    id: string;
    email: string;
  };
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) throw new HttpError(401, "Missing auth token");

    const payload = tokenSchema.parse(jwt.verify(token, config.JWT_SECRET));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true }
    });
    if (!user) throw new HttpError(401, "Invalid auth token");

    (req as AuthedRequest).user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid auth token"));
  }
};

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, config.JWT_SECRET, { expiresIn: "7d" });
}
