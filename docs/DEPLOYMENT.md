# Deployment Guide

## Recommended Production Architecture

- Frontend: Vercel, deployed from `apps/web`
- API: Railway, Render, Fly.io, or AWS ECS, deployed from `apps/api`
- Database: Managed PostgreSQL
- Vector database: Pinecone, Weaviate, Chroma, or PostgreSQL with pgvector
- Auth: Clerk or Firebase Auth
- Realtime: Socket.io on the API service, browser speech recognition, or Sarvam-compatible voice services
- Storage: S3-compatible bucket for uploaded PDFs, docs, and avatars

## Environment Variables

Copy `.env.example` into each environment and set:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_BASE_URL`
- `API_BASE_URL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `SARVAM_API_KEY`
- Sarvam speakers for Hindi and English

## Database

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

For pgvector, enable the extension in the production database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then replace the in-memory vector store in `apps/api/src/services/vector-store.ts` with Pinecone, Weaviate, Chroma, or pgvector-backed search.

## Web Deployment

Set the project root to `apps/web`.

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

## API Deployment

Set the project root to `apps/api`.

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Expose port from `API_PORT`.

## Security Checklist

- Use HTTPS only
- Set strict CORS for dashboard APIs
- Keep widget endpoints rate-limited
- Store API keys only on the server
- Issue short-lived voice tokens where supported
- Encrypt uploaded files at rest
- Add consent text for voice recording
- Add data export/delete workflows for GDPR-style compliance
- Validate allowed crawl domains per site owner
- Add abuse monitoring for prompt injection attempts

## Production Hardening Tasks

- Add a background queue for crawling and document parsing
- Add robots.txt/sitemap support for crawling
- Persist conversations and analytics events in PostgreSQL
- Add human handoff inbox for WhatsApp, CRM, and email
- Add owner-configurable guardrails and fallback messages
