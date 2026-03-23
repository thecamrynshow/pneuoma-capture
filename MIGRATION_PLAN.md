# PNEUOMA Capture — Migration Plan (VM → Low-Cost Stack)

**Goal:** Migrate off the ~$21/day GCP VM to a pay-as-you-go stack. Target: **~$15–30/month** vs **~$600+/month**.

---

## Current Architecture (Costly)
- **GCP VM** (`pneuoma-ai`): Next.js app + SQLite + PNEUOMA AI (Whisper + Llama on GPU)
- **Cost:** ~$21/day when running

## Target Architecture (Low-Cost)

| Component   | Current        | Target          | Est. Cost      |
|------------|----------------|-----------------|----------------|
| App + API  | GCP VM         | Render or Vercel| $0–7/mo        |
| Database   | SQLite on VM   | Supabase        | $0 (free tier) |
| AI (Whisper)| Self-hosted   | Replicate API   | ~$0.005/transcription |
| AI (Llama) | Self-hosted    | Replicate API   | ~$0.01–0.03/call |

---

## Step 1: Supabase (Database + Auth optional)

1. Create account at [supabase.com](https://supabase.com)
2. New project → get `DATABASE_URL` (PostgreSQL)
3. Prisma: switch from SQLite to PostgreSQL
4. Export existing SQLite data and import to Supabase (one-time)

**Free tier:** 500MB DB, 50k MAUs.

---

## Step 2: Replicate (AI — Whisper + Llama)

1. Create account at [replicate.com](https://replicate.com)
2. Get API token
3. Replace `PNEUOMA_AI_URL` calls with Replicate API:
   - **Transcription:** `openai/whisper` or `meta/whisper-large-v3` (~$0.005/run)
   - **LLM (parse/templates/refine):** `meta/llama-3-8b` or similar (~$0.01–0.03/call)

**Pricing:** Pay per request, no idle cost.

---

## Step 3: Render or Vercel (App Hosting)

### Option A: Render
- [render.com](https://render.com) → New Web Service
- Connect GitHub repo, build `npm run build`, start `npm run start`
- Free tier: spins down after 15 min (cold start ~1 min)
- **Starter:** $7/mo for always-on, no spin-down

### Option B: Vercel
- [vercel.com](https://vercel.com) → Import Next.js project
- Serverless: always-on edge, no spin-down
- **Free tier:** generous for Next.js

---

## Step 4: Codebase Changes ✅ DONE

1. **Prisma:** Switched to `provider = "postgresql"`, use Supabase URL
2. **AI layer:** `src/lib/replicate-ai.ts` — Replicate Whisper + Llama
3. **AI routing:** `src/lib/ai.ts` uses Replicate when `REPLICATE_API_TOKEN` is set, else `PNEUOMA_AI_URL`
4. **Env vars:** `DATABASE_URL`, `REPLICATE_API_TOKEN`, `NEXTAUTH_*`

---

## Step 5: Cut Over

1. Deploy new stack (Render/Vercel + Supabase + Replicate)
2. Point `capture.pneuoma.com` to new host (DNS CNAME)
3. Run once: stop GCP VM

---

## Rollback

Keep GCP VM stopped (not deleted) for 1–2 weeks. If issues arise, restart VM and switch DNS back.

---

## Estimated Monthly Cost

| Service   | Free tier        | Low usage (100 incidents/mo) |
|-----------|------------------|-------------------------------|
| Supabase  | $0               | $0                            |
| Replicate | Pay per use      | ~$5–15                        |
| Render    | $0 (cold start)  | $7 (always-on)                |
| Vercel    | $0               | $0                            |
| **Total** | **~$5–15**       | **~$12–22**                   |

vs **~$600+/mo** for 24/7 GPU VM.
