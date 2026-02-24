# Set NEXT_PUBLIC_API_URL on Vercel

**Local:** Already set in `.env.local` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

**Vercel (production):** Set the backend URL so the deployed app can reach your API (e.g. Render).

## Option A – Vercel Dashboard (recommended)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your project.
2. **Settings** → **Environment Variables**.
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** your backend URL (e.g. `https://your-app.onrender.com`)
   - **Environments:** Production (and Preview if you use it).
4. Save and **redeploy** the project so the new variable is applied.

## Option B – Vercel CLI

From the project root:

```bash
npx vercel env add NEXT_PUBLIC_API_URL production
```

When prompted, paste your backend URL (e.g. `https://your-app.onrender.com`). Then redeploy.
