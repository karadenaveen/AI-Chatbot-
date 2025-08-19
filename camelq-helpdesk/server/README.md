# CamelQ AI Helpdesk (Drop-in Chatbot)

This is a self-contained Node.js server that exposes:
- A REST API for chat: `POST /api/chat`
- A static web widget you can embed in any existing website: `GET /widget/camelq-helpdesk.js` and `GET /widget/camelq-helpdesk.css`

It is pre-configured to act as CamelQ's AI Helpdesk. You can customize FAQs in `data/faqs.json`. It can ingest from your website via two modes:
- Live Retrieval (no files): fetches and caches official site content at query-time
- Offline Build (optional): crawl and embed to `data/embeddings.json`

## Quick start

1) Set up environment
- Copy `.env.example` to `.env` and set at least `ADMIN_TOKEN`
- For AI answers: set `OPENAI_API_KEY`
- For live retrieval: set `LIVE_SITE_BASE_URL` (e.g., `https://www.camelq.com`)

2) Install and run
```bash
cd server
npm install
npm start
```

3) Embed the widget in your existing website (e.g., in your global HTML `<head>` or right before `</body>`) by adding:
```html
<link rel="stylesheet" href="https://YOUR_DOMAIN_OR_IP:3000/widget/camelq-helpdesk.css" />
<script src="https://YOUR_DOMAIN_OR_IP:3000/widget/camelq-helpdesk.js" data-api-base="https://YOUR_DOMAIN_OR_IP:3000" defer></script>
```
- Replace `YOUR_DOMAIN_OR_IP:3000` with where this server is reachable from your site.
- If your site and this server share the same origin, you may omit `data-api-base`.

## Live Retrieval (no JSON files)
- Set in `.env`:
```
LIVE_SITE_BASE_URL=https://YOUR-OFFICIAL-DOMAIN
LIVE_MAX_PAGES=100
LIVE_CACHE_TTL_SECONDS=600
```
- The server will crawl and cache a snapshot in memory on demand, keep it fresh by TTL, and retrieve relevant chunks for answers.
- If `OPENAI_API_KEY` is set, semantic retrieval uses embeddings in memory; otherwise, it falls back to keyword matching.

## Offline Build (optional)
If you prefer a prebuilt KB, you can still use:
- `npm run crawl` -> writes `data/sources.jsonl`
- `npm run build-kb` -> writes `data/embeddings.json`

## Admin UI
- Visit `/admin/` and use `ADMIN_TOKEN` to:
  - Browse/edit crawled documents (offline build mode)
  - Trigger KB rebuild (offline build mode)

## API
- POST `/api/chat` returns `{ reply, sessionId, sources }` where `sources` includes top URLs and titles.

## Configuration
- `.env`
  - `OPENAI_API_KEY` (recommended)
  - `PORT` (default 3000)
  - `OPENAI_MODEL` (default `gpt-4o-mini`)
  - `ALLOWED_ORIGINS` (default `*`)
  - `ADMIN_TOKEN` (required for admin endpoints)
  - `LIVE_SITE_BASE_URL` (enable live mode)
  - `LIVE_MAX_PAGES` (default 50)
  - `LIVE_CACHE_TTL_SECONDS` (default 600)