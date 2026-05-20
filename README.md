# Website AI Assistant

A production-style starter for a Hindi-first AI customer support and sales assistant that can be embedded into any website with one JavaScript snippet.

## What Is Included

- Next.js admin dashboard and product UI
- Owner signup/login with JWT auth
- Floating website widget with chat, voice states, dark/light theme, and Hindi/English behavior
- Express API for auth-ready tenants, embed script delivery, chat, voice, crawling, training, analytics, and handoff hooks
- Prisma PostgreSQL schema for tenants, sites, pages, knowledge chunks, conversations, leads, events, uploads, and integrations
- RAG pipeline structure with Groq-powered answers and a vector-store abstraction
- Multi-page crawler and visible-content extractor
- API documentation and deployment guide

## Quick Start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open:

- Web app: http://localhost:3000
- API: http://localhost:4000/health

For a local database, start PostgreSQL first:

```bash
docker compose up -d postgres
```

## Embed Snippet

After creating a site in the dashboard, website owners paste this inside their `<head>`:

```html
<script
  async
  src="https://your-api-domain.com/embed/assistant.js"
  data-site-id="site_demo_123"
></script>
```

The script loads the floating widget, indexes the current page, and can request a crawl for the full website.

## Production Notes

This repository is a complete implementation scaffold. To go live, connect real provider credentials, run the database migrations, choose a production vector database, and deploy the web/API services separately.
