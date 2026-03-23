# Migrate Incidents from VM to Supabase

This guide moves users and incidents from the old SQLite database on the GCP VM to your new Supabase PostgreSQL database.

## Prerequisites

- GCP VM must be **started**
- You have SSH access to the VM
- `DATABASE_URL` in `.env` points to Supabase (or set it when running)

## Step 1: Copy prod.db from the VM

SSH into the VM and copy the database file from the Docker container:

```bash
gcloud compute ssh pneuoma-ai --zone=us-central1-a --project=pilotengine
```

Then on the VM:

```bash
# Find the container ID if the name is different
docker ps

# Copy prod.db from the running container (container name: pneuoma-capture)
docker cp pneuoma-capture:/app/prod.db ./prod.db

# Copy to your local machine (run this from your Mac, not on the VM)
# Replace pneuoma-ai with your instance name
gcloud compute scp pneuoma-ai:./prod.db ./prod.db --zone=us-central1-a --project=pilotengine
```

**If the container was recreated** (new deploy) and you didn't use a volume, the old `prod.db` may be gone. In that case, there's nothing to migrate.

## Step 2: Run the migration script

From the project root:

```bash
SQLITE_PATH=./prod.db npx node scripts/migrate-to-supabase.mjs
```

Or if `DATABASE_URL` isn't in `.env`:

```bash
SQLITE_PATH=./prod.db DATABASE_URL="postgresql://postgres:..." npx node scripts/migrate-to-supabase.mjs
```

Optionally set a custom password for the legacy account (for incidents that had no user):

```bash
LEGACY_PASSWORD="YourChosenPassword" SQLITE_PATH=./prod.db npx node scripts/migrate-to-supabase.mjs
```

## Step 3: Verify

- Log in to your app with your normal account — you should see your incidents
- Pre-auth incidents: log in as `legacy-import@pneuoma.local` with the password printed by the script
- Change that password after first login
