import { embedText } from "./ai.js";
import { prisma } from "../db.js";

type Chunk = {
  siteId: string;
  sourceUrl?: string;
  title?: string;
  text: string;
  embedding: number[];
};

const memoryStore: Chunk[] = [];

export async function upsertKnowledge(input: {
  siteId: string;
  sourceUrl?: string;
  title?: string;
  chunks: string[];
}) {
  for (const chunk of input.chunks) {
    await prisma.knowledgeChunk.create({
      data: {
        siteId: input.siteId,
        source: input.title ?? input.sourceUrl ?? "training",
        sourceUrl: input.sourceUrl,
        content: chunk
      }
    });
    memoryStore.push({
      siteId: input.siteId,
      sourceUrl: input.sourceUrl,
      title: input.title,
      text: chunk,
      embedding: await embedText(chunk)
    });
  }
}

export async function searchKnowledge(siteId: string, query: string) {
  const queryEmbedding = await embedText(query);
  let candidates = memoryStore.filter((item) => item.siteId === siteId);

  if (!candidates.length) {
    const stored = await prisma.knowledgeChunk.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    candidates = await Promise.all(
      stored.map(async (item) => ({
        siteId,
        sourceUrl: item.sourceUrl ?? undefined,
        title: item.source,
        text: item.content,
        embedding: await embedText(item.content)
      }))
    );
  }

  if (!queryEmbedding.length) {
    return candidates
      .slice(-6)
      .map(formatChunk)
      .join("\n\n");
  }

  return candidates
    .map((item) => ({ item, score: cosine(queryEmbedding, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => formatChunk(item))
    .join("\n\n");
}

function formatChunk(chunk: Chunk) {
  return `Source: ${chunk.title || chunk.sourceUrl || "training"}\n${chunk.text}`;
}

function cosine(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aMag += a[index] ** 2;
    bMag += b[index] ** 2;
  }
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}
