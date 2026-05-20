import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "node:http";
import { pinoHttp } from "pino-http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { errorHandler } from "./utils/errors.js";
import { apiLimiter, widgetLimiter } from "./utils/rate-limit.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { conversationsRouter } from "./routes/conversations.js";
import { crawlRouter } from "./routes/crawl.js";
import { embedRouter } from "./routes/embed.js";
import { siteRouter } from "./routes/sites.js";
import { trainingRouter } from "./routes/training.js";
import { voiceRouter } from "./routes/voice.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "website-ai-assistant-api" });
});

app.use("/embed", widgetLimiter, embedRouter);
app.use("/api/auth", apiLimiter, authRouter);
app.use("/api/sites", apiLimiter, siteRouter);
app.use("/api/chat", widgetLimiter, chatRouter);
app.use("/api/conversations", apiLimiter, conversationsRouter);
app.use("/api/voice", widgetLimiter, voiceRouter);
app.use("/api/crawl", apiLimiter, crawlRouter);
app.use("/api/training", apiLimiter, trainingRouter);
app.use("/api/analytics", apiLimiter, analyticsRouter);
app.use(errorHandler);

io.on("connection", (socket) => {
  socket.on("join:site", (siteId: string) => socket.join(`site:${siteId}`));
  socket.on("handoff:message", (payload) => {
    io.to(`site:${payload.siteId}`).emit("handoff:message", payload);
  });
});

server.listen(config.API_PORT, () => {
  console.log(`API listening on ${config.API_BASE_URL}`);
});
