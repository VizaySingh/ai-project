# API Documentation

Base URL: `https://your-api-domain.com`

## Health

`GET /health`

Returns service status.

## Authentication

`POST /api/auth/signup`

```json
{
  "email": "owner@example.com",
  "password": "minimum-8-chars"
}
```

`POST /api/auth/login`

Returns a JWT token. Users are stored in PostgreSQL through Prisma.

## Sites

`POST /api/sites`

Creates a website assistant profile and returns the embed code.

```json
{
  "name": "Acme Store",
  "domain": "https://example.com",
  "assistantName": "Asha AI",
  "voiceEnabled": true,
  "languages": ["hi", "en"],
  "theme": "dark"
}
```

Requires `Authorization: Bearer <token>`.

`GET /api/sites`

Lists the authenticated owner's websites, counts, and embed codes.

## Embed Script

`GET /embed/assistant.js`

Website owners paste:

```html
<script async src="https://your-api-domain.com/embed/assistant.js" data-site-id="site_xxx"></script>
```

The script:

- injects the floating widget
- extracts visible page content
- sends content to `/api/crawl/page`
- supports Hindi/English chat
- uses browser speech recognition when available

## Crawling And Indexing

`POST /api/crawl/page`

Indexes a page payload sent by the widget.

```json
{
  "siteId": "site_xxx",
  "url": "https://example.com/pricing",
  "title": "Pricing",
  "text": "Visible page text..."
}
```

`POST /api/crawl/site`

Crawls same-origin pages from a start URL.

```json
{
  "siteId": "site_xxx",
  "startUrl": "https://example.com",
  "maxPages": 25
}
```

## Chat

`POST /api/chat`

```json
{
  "siteId": "site_xxx",
  "message": "Pricing Hindi mein batao",
  "pageUrl": "https://example.com/pricing",
  "mode": "text"
}
```

Returns:

```json
{
  "answer": "आपके लिए Starter...",
  "language": "hi",
  "mode": "text"
}
```

## Training

`POST /api/training/text`

Adds manual trusted content. Requires owner authentication.

`POST /api/training/upload`

Uploads documents. This scaffold accepts text-like document buffers directly; production should add PDF/DOCX parsing with a queue worker.

## Conversations

`GET /api/conversations/:siteId`

Returns the authenticated owner's recent visitor conversations and messages for a website.

## Voice

`POST /api/voice/tts`

Converts answer text to voice through Sarvam AI when configured.

`GET /api/voice/realtime-token`

Returns the configured voice provider mode. The current scaffold uses Sarvam AI for spoken replies.

## Analytics

`POST /api/analytics/event`

Stores widget events such as `chat_started`, `voice_started`, `lead_captured`, and `handoff_requested`.

`GET /api/analytics/:siteId/summary`

Returns dashboard metrics and recent events.
