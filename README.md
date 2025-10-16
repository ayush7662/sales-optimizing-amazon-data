# SalesDuo Listing Optimizer

A full‑stack web app that fetches Amazon product details by ASIN, uses an AI model to optimize the listing (title, bullets, description, keywords), shows original vs optimized side‑by‑side, and stores optimization history in MySQL.

## Features
- Enter an ASIN and fetch live product data from Amazon product pages.
- Robust scraping with Axios first, Puppeteer fallback, locale rotation (.com/.in/.co.uk), retry/backoff, A+ content fallbacks, and a “mock” fallback flag.
- AI optimization using Gemini with compliance‑aware prompt and JSON post‑processing (limits, dedupe, emoji stripping).
- Side‑by‑side comparison UI with diff highlights, copy buttons, JSON download, and light/dark mode.
- History with pagination, run metadata (model, duration, source/mock), and server‑side “improvement” summaries (word deltas).

## Tech Stack
- Backend: Node.js, Express, Sequelize (MySQL), Axios, Cheerio, Puppeteer
- AI: Google Generative AI (Gemini)
- Frontend: React (Vite), Tailwind (utility classes + CSS variables for theme)
- DB: MySQL

## Prerequisites
- Node.js 18+ and npm
- MySQL server
- Gemini API key

## Setup

### 1) Clone and install
Backend
```
cd backend
npm install
```

Frontend
```
cd ../frontend
npm install
```

### 2) Environment variables
- backend/.env (copy from .env.example)
  - PORT=5000
  - DB_HOST, DB_USER, DB_PASS, DB_NAME
  - GEMINI_API_KEY=your_key
  - GEMINI_MODEL=gemini-2.0-flash-exp
  - CORS_ORIGIN=http://localhost:5173
- frontend/.env (copy from .env.example)
  - VITE_API_BASE=http://localhost:5000

Do not commit .env files; only commit the .env.example placeholders.

### 3) Create database
```
CREATE DATABASE salesduo CHARACTER SET utf8mb4;
```

### 4) Run
Backend
```
cd backend
npm start # authenticates, syncs Sequelize tables, starts server
```

Frontend
```
cd ../frontend
npm run dev # open the shown Vite URL (e.g., http://localhost:5173)
```

## Usage
1. Enter a valid ASIN (8–12 alphanumeric) and click “Optimize”.
2. The app scrapes Amazon (Axios→Puppeteer fallback). If block occurs, a mock dataset is used and flagged as “mock”.
3. Gemini generates optimized title, bullets, description, and 3–5 keywords.
4. Both versions are shown side‑by‑side with word‑level diffs. You can copy text or download the JSON.
5. Each run is stored in MySQL; visit the History table to review and compare any run.

## API

- `GET /health` → `{ ok: true }`
- `POST /api/asin/optimize`
  - Body: `{ "asin": "B07H65KP63" }`
  - Response: `{ id, asin, original, optimized, model, durationMs, source, mock, summary }`
  - 422 errors:
    - INVALID_ASIN – ASIN format invalid
    - SCRAPE_FAIL – could not fetch enough product data
    - AI_FAIL – AI generation error
- `GET /api/history?asin=...&page=1&pageSize=10`
- `GET /api/history/:id`

## Scraping Details
- Tries .com → .in → .co.uk with User‑Agent headers.
- Extractors:
  - Title: `#productTitle`
  - Bullets: `#feature-bullets ul li`
  - Description: `#productDescription p` → `#productDescription` → `#aplus_feature_div` → generic A+ nodes
- On persistent failure, returns a safe mock payload and sets `mock: true`.
- Response includes `source` (e.g., `axios:https://www.amazon.com/dp/...` or `puppeteer:...`) for debugging.

## AI Prompt & Guardrails
- No HTML, emojis, discount language, or unverifiable/medical claims.
- Title ≤ 200 chars; bullets ≤ 200 chars each (max 5); description concise and compliant.
- Keywords: 3–5 short phrases, no brand hijacking/ASINs.
- Output required as strict JSON. Post‑processing enforces limits, strips emojis, and dedupes keywords.

## Data Model (Sequelize)
- ListingRun:
  - asin (string)
  - original (JSON)
  - optimized (JSON)
  - model (string)
  - promptHash (string)
  - durationMs (int)
  - source (string, which scraper source)
  - mock (boolean)
  - summary (JSON: { title: {added, removed}, bullets: {added, removed} })
  - createdAt, updatedAt

## Common Issues

- **CORS blocked:**
  - Ensure `CORS_ORIGIN=http://localhost:5173` in backend .env.
- **Puppeteer fails on Linux:**
  - Use `--no-sandbox` args (already set) and install Chromium deps (libnss3, fonts).
- **Scraping blocked:**
  - You’ll see `mock: true`; try a different locale or later.
- **422 INVALID_ASIN:**
  - Use 8–12 alphanumeric uppercase/lowercase.
- **AI_FAIL:**
  - Check API key/quotas; re-run with lower frequency.

## Scripts

Backend
- `npm start` – start server
- Add `npm run dev` with nodemon if desired

Frontend
- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview after build

## Repository Hygiene
- Do not commit local DB files (e.g., salesduo.db).  
- Commit `.env.example`, not `.env`.  
- See backend/.gitignore and frontend/.gitignore for full rules.

## License
MIT

## Maintainer
Gaurav Jikar
