# CamelQ AI Helpdesk (Drop-in Chatbot)

This is a self-contained Node.js server that exposes:
- A REST API for chat: `POST /api/chat`
- A static web widget you can embed in any existing website: `GET /widget/camelq-helpdesk.js` and `GET /widget/camelq-helpdesk.css`

It is pre-configured to act as CamelQ's AI Helpdesk. You can customize FAQs in `data/faqs.json` and ingest content from your official website.

## Quick start

1) Set up environment
- Copy `.env.example` to `.env` and set `OPENAI_API_KEY`

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

## Ingest official website content (optional but recommended)

4) Crawl your site
```bash
# Example: export your base URL and limit
export BASE_URL="https://www.camelq.com"
export MAX_PAGES=100
npm run crawl
```
- Output is written to `data/sources.jsonl` (one JSON per line: `{url,title,text}`).

5) Build embeddings
```bash
npm run build-kb
```
- Output is written to `data/embeddings.json`.

Once built, the assistant uses vector retrieval to answer with up-to-date info from your site.

## API

- POST `/api/chat`
  - Request JSON:
    ```json
    {
      "sessionId": "optional-stable-id",
      "message": "User message text",
      "history": [
        {"role":"user","content":"..."},
        {"role":"assistant","content":"..."}
      ]
    }
    ```
  - Response JSON:
    ```json
    {
      "reply": "Assistant reply",
      "sessionId": "stable-id"
    }
    ```

## Customize CamelQ knowledge
- Edit `data/faqs.json` to add or modify FAQs.
- Optionally build embeddings from your official website.

## Configuration
- `.env`
  - `OPENAI_API_KEY` (required for embeddings and LLM answers)
  - `PORT` (default 3000)
  - `OPENAI_MODEL` (default `gpt-4o-mini`)
  - `ALLOWED_ORIGINS` (comma-separated list, default `*`)

## Production notes
- Place this behind HTTPS (TLS).
- Consider persistent storage for sessions and logs.
- Rate limit is enabled on `/api/*`. Adjust as needed.