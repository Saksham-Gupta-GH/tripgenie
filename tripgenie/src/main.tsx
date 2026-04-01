import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/** Each check must use a literal `import.meta.env.VITE_*` — Vite cannot replace dynamic keys. */
function getMissingFirebaseEnv(): string[] {
  const missing: string[] = []
  const isPlaceholder = (val: any) => !val || val.includes('_here') || val.includes('your_')

  if (isPlaceholder(import.meta.env.VITE_FIREBASE_API_KEY)) missing.push('VITE_FIREBASE_API_KEY')
  if (isPlaceholder(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
  if (isPlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID)) missing.push('VITE_FIREBASE_PROJECT_ID')
  if (isPlaceholder(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)) missing.push('VITE_FIREBASE_STORAGE_BUCKET')
  if (isPlaceholder(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)) {
    missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID')
  }
  if (isPlaceholder(import.meta.env.VITE_FIREBASE_APP_ID)) missing.push('VITE_FIREBASE_APP_ID')
  return missing
}

const rootEl = document.getElementById('root')!
const missingFirebase = getMissingFirebaseEnv()

if (missingFirebase.length > 0) {
  rootEl.innerHTML = `
    <div style="padding:2rem;max-width:36rem;margin:2rem auto;font-family:system-ui,sans-serif;line-height:1.55;color:#0f172a">
      <h1 style="font-size:1.35rem;margin:0 0 0.75rem">Missing Firebase configuration</h1>
      <p style="color:#475569;margin:0 0 1rem">Vite only reads <code style="background:#f1f5f9;padding:0.1rem 0.35rem;border-radius:4px;font-size:0.9em">VITE_*</code> variables at <strong>build</strong> time. Add these in Vercel under <strong>Project → Settings → Environment Variables</strong> (check <strong>Production</strong>), then open <strong>Deployments</strong> and click <strong>Redeploy</strong>.</p>
      <p style="color:#64748b;font-size:0.95rem;margin:0 0 0.75rem">Missing:</p>
      <ul style="margin:0;padding-left:1.25rem">${missingFirebase.map((k) => `<li style="margin:0.35rem 0"><code style="background:#f1f5f9;padding:0.15rem 0.4rem;border-radius:4px">${k}</code></li>`).join('')}</ul>
    </div>
  `
} else {
  const { default: App } = await import('./App.tsx')
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
