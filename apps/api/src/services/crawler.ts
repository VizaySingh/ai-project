import * as cheerio from "cheerio";
import { prisma } from "../db.js";
import { chunkText } from "./chunker.js";
import { upsertKnowledge } from "./vector-store.js";

export async function indexPage(input: {
  siteId: string;
  url: string;
  title?: string;
  text: string;
}) {
  await prisma.page.upsert({
    where: { siteId_url: { siteId: input.siteId, url: input.url } },
    create: {
      siteId: input.siteId,
      url: input.url,
      title: input.title,
      textHash: String(hashText(input.text))
    },
    update: {
      title: input.title,
      textHash: String(hashText(input.text)),
      indexedAt: new Date()
    }
  });
  await upsertKnowledge({
    siteId: input.siteId,
    sourceUrl: input.url,
    title: input.title,
    chunks: chunkText(input.text)
  });
}

function hashText(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export async function crawlWebsite(input: {
  siteId: string;
  startUrl: string;
  maxPages?: number;
}) {
  const origin = new URL(input.startUrl).origin;
  const queue = [input.startUrl];
  const seen = new Set<string>();
  const indexed: string[] = [];
  const maxPages = input.maxPages ?? 25;

  while (queue.length && indexed.length < maxPages) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    try {
      const response = await fetch(url, { redirect: "follow" });
      const html = await response.text();
      const $ = cheerio.load(html);
      $("script,style,noscript,svg,canvas").remove();
      const title = $("title").first().text() || url;
      const text = $("body").text().replace(/\s+/g, " ").trim();
      await indexPage({ siteId: input.siteId, url, title, text });
      indexed.push(url);

      $("a[href]").each((_index, element) => {
        const href = $(element).attr("href");
        if (!href) return;
        const nextUrl = new URL(href, url);
        nextUrl.hash = "";
        if (nextUrl.origin === origin && !seen.has(nextUrl.href) && queue.length < maxPages * 3) {
          queue.push(nextUrl.href);
        }
      });
    } catch {
      // Crawling continues even when a single page fails.
    }
  }

  return indexed;
}
