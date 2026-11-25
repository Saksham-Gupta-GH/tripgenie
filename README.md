# TripGenie

TripGenie is a role‑based travel planning platform that connects travellers with expert agents. Agents curate detailed trip plans, travellers discover and select plans with a travel date, and admins oversee the system.

The built-in assistant uses a resilient RAG pipeline: a PyTorch sentence-transformer ranks agent-curated Firestore plans, Gemini generates a grounded answer, and OpenRouter is used automatically if Gemini is unavailable. Keyword retrieval keeps chat operational if the semantic retrieval service is offline.

Live: [https://tripgenie-ashy.vercel.app](https://tripgenie-ashy.vercel.app)

## Features
- Role‑based access: Traveller, Agent, Admin
- Agent plan creation with itinerary and destination images
- Traveller discovery, search, and plan selection with travel date
- Plan details with itinerary and image gallery
- Admin user management and system overview
- Semantic RAG over agent-curated plans with cited plan IDs
- Gemini generation with OpenRouter failover
- PyTorch retrieval service with keyword fallback

## Tech Stack
- React + TypeScript + Vite
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Vercel for deployment
- PyTorch + Sentence Transformers + FastAPI for semantic retrieval

## Getting Started
### 1) Install
```bash
cd tripgenie
npm install
```

### 2) Configure Environment
Create a `.env` based on `.env.example`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash-latest
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
RETRIEVAL_SERVICE_URL=
RETRIEVAL_SERVICE_TOKEN=
APP_URL=https://tripgenie-ashy.vercel.app
```

### 3) Run Locally
```bash
npm run dev
```

### 4) Build
```bash
npm run build
```

## RAG Retrieval Service

Deploy `retrieval-service/` as a Docker service on Cloud Run, Render, or another container platform. Set the same `RETRIEVAL_SERVICE_TOKEN` on the retrieval service and Vercel, then set its public HTTPS URL as `RETRIEVAL_SERVICE_URL` in Vercel.

```bash
docker build -t tripgenie-retriever ./retrieval-service
docker run -p 8080:8080 \
  -e RETRIEVAL_SERVICE_TOKEN=replace-with-a-long-random-secret \
  tripgenie-retriever
```

The service downloads `all-MiniLM-L6-v2` on first use. `GET /health` is available for health checks. If this service times out or fails, the Vercel API automatically uses keyword ranking; it does not make an additional LLM call.

### Request flow

1. The authenticated client reads the plans already available to it from Firestore.
2. `/api/gemini` validates and limits candidate plan fields.
3. The PyTorch service ranks candidates semantically and returns the top four.
4. The API constructs a grounded prompt requiring plan-title and plan-ID citations.
5. Gemini generates the answer; OpenRouter is called only if Gemini fails.

Keep all AI and retrieval secrets server-side. Do not prefix them with `VITE_`.

## Firebase Setup
Deploy Firestore rules (and storage rules after enabling Storage in Firebase Console):
```bash
firebase deploy --only firestore:rules --project <your-project-id>
```

If you want to deploy Storage rules too:
```bash
firebase deploy --only storage --project <your-project-id>
```

## Admin Account
The admin role is restricted to a single email:
- `saksham77779@gmail.com`

You can update this in:
- `src/config/admin.ts`

## Deployment
Vercel is connected to GitHub. Push to `main` to redeploy:
```bash
git add . && git commit -m "chore: update" && git push origin main
```

## Scripts
- `npm run dev` – start development server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – lint the codebase
