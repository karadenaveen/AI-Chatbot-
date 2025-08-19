# CamelQ AI Helpdesk (Drop-in Chatbot)

This is a self-contained Node.js server that exposes:
- A REST API for chat: `POST /api/chat`
- A static web widget you can embed in any existing website: `GET /widget/camelq-helpdesk.js` and `GET /widget/camelq-helpdesk.css`

It is pre-configured to act as CamelQ's AI Helpdesk. You can customize FAQs in `data/faqs.json`.

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
- The server does a simple relevance scan and passes the most relevant entries as context to the AI.

## Configuration
- `.env`
  - `OPENAI_API_KEY` (required)
  - `PORT` (default 3000)
  - `OPENAI_MODEL` (default `gpt-4o-mini`)
  - `ALLOWED_ORIGINS` (comma-separated list, default `*`)

## Production notes
- Place this behind HTTPS (TLS). For quick local tests, self-signed is fine.
- Consider adding persistent session storage (Redis) if you need multi-instance scaling.
- You can containerize this with your preferred process manager or Docker.