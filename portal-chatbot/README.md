## Company Portal Chatbot (MySQL-integrated)

A full-stack portal chatbot that helps customers and employees interact with your company's MySQL data. Includes safe SQL execution, schema exploration, and optional LLM integration.

### Features
- Chat UI for customers and employees
- MySQL integration with safe, read-only query execution by default
- Automatic schema introspection and display
- Optional LLM (OpenAI) to propose SQL and generate helpful responses
- Dockerized stack (MySQL, backend, frontend)

### Stack
- Backend: Node.js (Express), MySQL (mysql2), OpenAI (optional)
- Frontend: React + Vite + TypeScript
- Database: MySQL 8

### Quick Start (Docker)
1. Copy environment example:
   ```bash
   cp .env.example .env
   ```
2. Start the services:
   ```bash
   docker compose up --build
   ```
3. Open the app:
   - Frontend: http://localhost:${FRONTEND_PORT:-5173}
   - Backend health: http://localhost:${BACKEND_PORT:-3001}/api/health

### Local Development (without Docker)
- MySQL: start a local server and import `sql/init.sql`
- Backend:
  ```bash
  cd backend
  cp ../.env.example .env
  npm install
  npm run dev
  ```
- Frontend:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

### Environment Variables
See `.env.example` for all variables. Key ones:
- `MYSQL_*`: MySQL connection
- `OPENAI_API_KEY`: optional; enable LLM responses
- `ALLOW_WRITES`: allow DML/DDL if `true` (default `false`)
- `AUTO_EXECUTE_SQL`: auto-run safe SQL proposed by the model (default `true`)
- `MAX_QUERY_ROWS`: max rows per query (default `200`)

### Safety
- Only SELECT/SHOW/DESCRIBE/EXPLAIN are allowed by default
- Multi-statement and destructive commands are blocked
- Limits are auto-applied and clamped to `MAX_QUERY_ROWS`

### Project Structure
```
portal-chatbot/
  backend/
  frontend/
  sql/
  docker-compose.yml
  .env.example
```

### Seed Data
`sql/init.sql` creates sample business tables (`customers`, `orders`, `products`, `order_items`) and chat tables (`conversations`, `messages`).

### Notes
- If `OPENAI_API_KEY` is unset, the assistant falls back to a simple templated response and does not generate SQL.
- Adjust prompts in `backend/src/prompts/systemPrompt.txt`.