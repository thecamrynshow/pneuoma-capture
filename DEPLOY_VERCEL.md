# Deploy PNEUOMA Capture to Vercel + Supabase

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. After creation: **Project Settings** → **Database** → copy **Connection string**
3. Use the **Connection pooling** URL (port 6543) for serverless
4. Add `?pgbouncer=true` if needed for pooling

## 2. Replicate Setup

1. Go to [replicate.com](https://replicate.com) → Sign up
2. **Account** → **API tokens** → Create token
3. Copy the token (starts with `r8_`)

## 3. Vercel Deployment

1. Push this repo to GitHub
2. Vercel Dashboard → **Add New** → **Project** → Import from GitHub
3. Root directory: `./` (or wherever this Next.js app lives)
4. **Environment Variables** (add before deploy):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase **pooler** URI (port **6543**), add `?pgbouncer=true` for transaction mode |
| `DIRECT_URL` | Supabase **direct** URI (port **5432**, host `db.<project>.supabase.co`) — required for `prisma db push` on Vercel builds |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `REPLICATE_API_TOKEN` | Your Replicate token |

5. Deploy

## 4. Database Schema

The default **`npm run build`** runs **`prisma db push`** before `next build`. You **must** set both **`DATABASE_URL`** (pooler) and **`DIRECT_URL`** (direct `5432`) in Vercel — `db push` cannot use the transaction pooler alone.

**If the build still fails:** open the Vercel build log and search for `prisma`; fix password URL-encoding (`@` → `%40`) and redeploy.

**Push schema from your machine** (works even if your shell was in the wrong folder before — this script uses the repo root):

```bash
npm run db:push
```

(Uses `DATABASE_URL` from `.env` or pass it inline: `DATABASE_URL="postgresql://..." npm run db:push`)

**Skip `db push` on Vercel** only if you manage the schema elsewhere: set **Build Command** to `npm run build:next-only`.

## 5. Custom Domain (capture.pneuoma.com)

1. Vercel Project → **Settings** → **Domains**
2. Add `capture.pneuoma.com`
3. Update DNS: CNAME `capture` → `cname.vercel-dns.com`

## 6. Capacitor / iOS

Update `capacitor.config.ts`:
- `server.url` = `https://your-project.vercel.app` (or `https://capture.pneuoma.com`)

## Note: Function Timeout

- **Vercel Hobby:** 10s function timeout — may fail on long audio
- **Vercel Pro:** 60s — recommended for transcription
