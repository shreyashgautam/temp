# Vercel Deployment Guide

This project should be deployed as two separate Vercel projects:

1. Frontend project
2. Backend project

The frontend is the Next.js app inside `v0-hackathon-development-order/`.

The backend is the Express API inside `backend1/`.

## Recommended order

1. Deploy the backend first
2. Copy the backend production URL
3. Set that backend URL in the frontend environment variables
4. Deploy the frontend

## Backend deployment

Create a new Vercel project with:

- Root Directory: `backend1`
- Framework Preset: `Other`

The backend already includes:

- `api/index.js` as the Vercel serverless entrypoint
- `vercel.json` routing all requests to the Express app
- a `/health` endpoint for basic smoke checks

### Backend environment variables

Set these in the Vercel dashboard for the backend project:

- `MONGO_URI`
- `MONGO_DB_NAME`
- `FRONTEND_URL`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` if used
- `TWILIO_ACCOUNT_SID` if WhatsApp is used
- `TWILIO_AUTH_TOKEN` if WhatsApp is used
- `TWILIO_WHATSAPP_FROM` if WhatsApp is used

Optional:

- `CHAT_SESSIONS_COLLECTION`
- `MONGO_AUTH_COLLECTION`
- `DATASET_DIR`

### Important backend notes

- On Vercel, uploads and vector index storage use temporary filesystem behavior.
- Chat sessions are stored in MongoDB, so they persist correctly.
- The local vectra RAG index is now redirected to `/tmp` on Vercel, which is ephemeral.
- The blockchain audit logger is in memory only. It works, but the chain is not persistent across cold starts or across multiple serverless instances.

If you want the blockchain audit trail to be truly production-grade, move it to MongoDB instead of in-memory state.

### Backend smoke checks after deploy

Replace `<backend-url>` with your deployed backend domain:

```bash
curl https://<backend-url>/health
curl https://<backend-url>/
curl https://<backend-url>/api/patients
```

Expected:

- `/health` returns `ok: true`
- `/` returns backend status JSON
- `/api/patients` returns patient data from MongoDB

## Frontend deployment

Create another Vercel project with:

- Root Directory: `v0-hackathon-development-order`
- Framework Preset: `Next.js`

### Frontend environment variables

Set this in the frontend Vercel project:

- `NEXT_PUBLIC_BACKEND_URL=https://<your-backend-url>`

Example:

```env
NEXT_PUBLIC_BACKEND_URL=https://medai-backend.vercel.app
```

### Frontend notes

- `next.config.mjs` already includes a Turbopack root setting to avoid multi-lockfile warnings in monorepo-style deployment.
- The frontend expects the backend base URL from `NEXT_PUBLIC_BACKEND_URL`.

## Deploy using the Vercel dashboard

### Backend

1. Push code to GitHub
2. In Vercel, click `Add New Project`
3. Import the repository
4. Set Root Directory to `backend1`
5. Add backend environment variables
6. Deploy

### Frontend

1. In Vercel, click `Add New Project`
2. Import the same repository again
3. Set Root Directory to `v0-hackathon-development-order`
4. Add `NEXT_PUBLIC_BACKEND_URL`
5. Deploy

## Deploy using the Vercel CLI

Install CLI:

```bash
npm i -g vercel
```

### Deploy backend

```bash
cd backend1
vercel
vercel --prod
```

### Deploy frontend

```bash
cd ../v0-hackathon-development-order
vercel
vercel --prod
```

## Local pre-deploy checks

### Backend

```bash
cd backend1
npm install
npm test
node server.js
```

### Frontend

```bash
cd v0-hackathon-development-order
npm install
npx tsc --noEmit
npm run build
```

## Known limitations to keep in mind

### Backend

- Socket.IO from `server.js` is for local Node server mode and is not the main Vercel runtime path
- in-memory blockchain data is not durable on Vercel
- local vector index data is not durable on Vercel

### Frontend

- build can depend on external font fetching if Google Fonts are used during build

## Recommended next improvement

For a more stable production backend, the next best step is:

1. move blockchain log storage to MongoDB
2. move vector search storage to MongoDB Atlas Vector Search or another persistent vector store
3. reduce file-based fallbacks where possible

## Useful docs

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel monorepos overview: https://vercel.com/docs/monorepos
- Vercel Node.js runtime: https://vercel.com/docs/functions/runtimes/node-js
