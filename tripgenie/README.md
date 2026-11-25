# TripGenie

TripGenie is a role‑based travel planning platform that connects travellers with expert agents. Agents curate detailed trip plans, travellers discover and select plans with a travel date, and admins oversee the system.

The assistant retrieves relevant agent-curated plans before generation. A PyTorch sentence-transformer performs semantic ranking, Gemini generates grounded answers, and OpenRouter provides automatic failover. Keyword retrieval is used if the PyTorch service is unavailable.

Live: [https://tripgenie-ashy.vercel.app](https://tripgenie-ashy.vercel.app)

## Features
- Role‑based access: Traveller, Agent, Admin
- Agent plan creation with itinerary and destination images
- Traveller discovery, search, and plan selection with travel date
- Plan details with itinerary and image gallery
- Admin user management and system overview
- Resilient RAG assistant with plan-title and plan-ID citations

## Tech Stack
- React + TypeScript + Vite
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Vercel for deployment
- PyTorch + Sentence Transformers retrieval service (see the root README)

## Getting Started
### 1) Install
```bash
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
