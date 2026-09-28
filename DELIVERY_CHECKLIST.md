# CloudViz — What YOU Need To Do Before Handing This To The Client

This is your side of the work. The application code is complete and tested (see
"What I already verified" at the bottom). Everything below is account creation,
key generation, and configuration — none of it requires more coding, but none of
it can be skipped either.

Work through this top to bottom. Rough total time: 2–4 hours if you already have
a Google/Microsoft account for Gmail, longer if you also stand up live AWS/OCI.

---

## 0. Bugs found and fixed in the review pass

I went back through the whole codebase specifically looking for problems before
calling this deployment-ready. Found and fixed four real issues:

1. **Cost totals would inflate every time "Refresh" was clicked.** `refreshDemoCost`
   was inserting a new cost record on every call, and the summary endpoint summed
   *all* recent records per provider — so cost kept climbing the more you refreshed,
   instead of reflecting the current month. Fixed by upserting one record per
   billing period and summarizing only the latest record per provider.
2. **Same bug, second location.** The cross-cloud efficiency calculation had the
   identical pattern (summing the last 5 cost records). Fixed to use only the
   current period's cost.
3. **Duplicate cloud accounts were possible.** Nothing stopped two rapid "Connect"
   requests (or a retried request) from creating two `DEMO`/`AWS`/`OCI` accounts
   for the same user, which would have duplicated every discovered resource under
   a second `cloudAccountId`. Fixed with an application-level check plus a unique
   database index as a second line of defense, with a graceful response if a race
   condition still slips through.
4. **Disconnecting a cloud account didn't remove its resources from view.** Resources
   stayed `isActive: true` forever after you clicked "Disconnect," so they'd keep
   appearing in the Resources page and dashboard counts. Fixed to mark them inactive
   on disconnect while preserving their historical metrics (per the retention
   approach in `BACKEND_SCHEMA.md`).

I also hardened the app for actual deployment (see Section 5 below): correct
`trust proxy` handling so rate-limiting works correctly behind Render/Vercel's
reverse proxy, pinned Node engine versions, and added Docker + `render.yaml` +
`vercel.json` configs (previously the code was deployment-*capable* but you'd
have had to write that plumbing yourself).

---

## 1. Absolutely required — the app will not run without these

### 1.1 MongoDB Atlas (database)
1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free **M0 cluster** (512 MB, ₹0).
3. Database Access → add a database user with a strong password (not your Atlas login password).
4. Network Access → add IP address:
   - For local dev: your current IP, or `0.0.0.0/0` temporarily.
   - For production (Render): `0.0.0.0/0` is generally required since Render's
     outbound IPs aren't static on the free/starter tier — restrict further only
     if you upgrade to a plan with static IPs.
5. Connect → Drivers → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cloudviz?retryWrites=true&w=majority`
6. Put this in `backend/.env` as `MONGODB_URI`.

**Without this, the backend still boots (health check works) but nothing persists —
you will not be able to register, log in, or see any data.**

### 1.2 JWT secret
Generate a long random string yourself, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Put it in `backend/.env` as `JWT_SECRET`. Never reuse a secret from another project,
never commit it, and rotate it if it's ever exposed (this immediately logs out all users).

### 1.3 CORS / client URL
Set `CLIENT_URL` in `backend/.env` to the exact origin(s) your frontend will be served
from (comma-separated if more than one), e.g.:
```
CLIENT_URL=https://cloudviz.yourdomain.com,http://localhost:5173
```

### 1.4 Frontend API URL
Set `VITE_API_URL` in `frontend/.env` to your backend's public URL + `/api`, e.g.:
```
VITE_API_URL=https://cloudviz-backend.onrender.com/api
```

---

## 2. Required for alert emails to actually send (strongly recommended)

Without this, alerts still work — they just log to the backend console instead of
emailing the user (this is intentional "Demo Email Mode" so the app never crashes
if email isn't configured).

### Gmail App Password (simplest free option)
1. Turn on 2-Step Verification on the Gmail account you want alerts to come from.
2. Go to https://myaccount.google.com/apppasswords and generate an app password.
3. In `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-address@gmail.com
   SMTP_PASSWORD=<the 16-character app password, no spaces>
   ALERT_FROM_EMAIL=CloudViz Alerts <your-address@gmail.com>
   ```
Any other SMTP provider (Zoho, Outlook, a transactional-email free tier) works the
same way — just swap the host/port.

---

## 3. Only needed if the client wants LIVE AWS monitoring (optional)

Demo Mode already gives the client a fully working, realistic-looking product with
zero cloud spend. Only do this section if they specifically want their own AWS
account monitored.

1. **Create an IAM user** dedicated to CloudViz — never use root account keys.
2. **Attach a read-only policy only.** At minimum:
   - `AmazonEC2ReadOnlyAccess`
   - `CloudWatchReadOnlyAccess`
   Do **not** grant any Stop/Terminate/Modify/Resize permissions — the app is
   designed to never need them (see PRD Section 7, "Out of Scope").
3. Generate an **Access Key** for that IAM user.
4. Put `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` in `backend/.env`.
5. **Cost Explorer is NOT free** (~$0.01/request). `AWS_ENABLE_COST_EXPLORER` defaults
   to `false` — leave it that way unless the client explicitly accepts the charge.
6. **The AWS adapter is fully coded**, not a stub — `backend/src/providers/aws/AWSAdapter.js`
   calls real EC2/CloudWatch/STS/Cost Explorer APIs via AWS SDK v3, and those SDK packages
   are already in `package.json` and confirmed to install correctly. What I could **not**
   do without your account is a live test run against real AWS infrastructure — the logic
   is correct and follows AWS's documented request/response shapes, but you should treat
   your first real connection as a genuine test, not a formality. Watch the backend logs
   when you click "Connect" on AWS in the Providers page.
7. Set a **billing alarm** on the AWS account before connecting anything real.

---

## 4. Only needed if the client wants LIVE OCI monitoring (optional)

Same logic as AWS — optional, and Demo Mode covers the demo/viva/client-preview use case.

1. Create an OCI account, generate an **API signing key pair** (Profile → API Keys).
2. Create a **read-only IAM policy** for the CloudViz group, e.g.:
   ```
   Allow group CloudVizReaders to read instance-family in tenancy
   Allow group CloudVizReaders to read metrics in tenancy
   ```
3. Put `OCI_TENANCY`, `OCI_USER_ID`, `OCI_FINGERPRINT`, `OCI_PRIVATE_KEY_PATH`,
   `OCI_REGION` in `backend/.env`. The private key file itself should live outside
   the repo (e.g. mounted as a secret file on your host), never committed.
4. **The OCI adapter is fully coded**, not a stub — `backend/src/providers/oci/OCIAdapter.js`
   calls real Compute/Monitoring/Identity/Usage APIs via `oci-sdk`, which is already in
   `package.json` and confirmed to install correctly. Same caveat as AWS: I could not run
   it against a live OCI tenancy, so treat your first real connection as a genuine test —
   watch the backend logs when you click "Connect" on OCI in the Providers page.

---

## 5. Deployment accounts

You have three deployment paths — pick whichever fits:

### 5.0 Fastest path — Render Blueprint
The repo includes `render.yaml`. In the Render dashboard: **New +** → **Blueprint** →
point it at your GitHub repo. This provisions the backend web service AND the frontend
static site in one step, reading their build/start commands from `render.yaml`
automatically. You'll still need to manually fill in the secret env vars it leaves
blank (`MONGODB_URI`, `JWT_SECRET`, SMTP, AWS/OCI credentials) in the dashboard —
committed files can't contain real secrets. This is the recommended path.

### 5.0b Docker path
`backend/Dockerfile` and `frontend/Dockerfile` are ready for any container host
(Render, Railway, Fly.io, a VPS, etc.). Locally, `docker compose up --build` from
the repo root gives you the full stack with a real MongoDB for testing before you
deploy anywhere. The frontend image serves via nginx with SPA routing already
configured (`frontend/nginx.conf`), so deep links won't 404 on refresh.

### 5.1 Backend hosting (manual Render setup, if not using the Blueprint)
1. Create a Render account, connect your GitHub repo.
2. New → Web Service → root directory `backend`.
3. Build command: `npm install` · Start command: `npm start`.
4. Add every variable from `backend/.env` into Render's Environment tab (never
   commit `.env` — `.gitignore` already excludes it).
5. Health check path: `/health`.
6. **Free tier sleeps after 15 minutes of inactivity** (cold start ~30–60s on the
   next request). If the client needs the backend always responsive instantly,
   use a paid Starter instance instead — this is a real cost/behavior tradeoff,
   not a bug, and it's worth explicitly agreeing with the client which one they want.

### 5.2 Frontend hosting (manual setup, if not using the Blueprint)
1. **Vercel**: import the repo, root directory `frontend`, build command `npm run build`,
   output directory `dist`. `frontend/vercel.json` already configures the SPA rewrite
   rule so deep links don't 404.
2. **Render Static Site** (alternative): same build settings; `frontend/public/_redirects`
   handles the SPA fallback automatically.
3. Either way, add `VITE_API_URL` pointing at your deployed backend + `/api`.
4. Vercel's free Hobby tier is intended for personal/non-commercial use per their
   terms — if this is a paid client engagement, check whether that matters to you
   contractually, or use Render's static site hosting instead.

### 5.3 Domain (optional)
Not required — the Render/Vercel-provided URL works fine for a client demo or a
small production deployment. Only buy a domain if the client specifically wants
their own branded URL.

---

## 6. Before you hand it to the client — final checks

- [ ] `backend/.env` is filled in and is **not** committed to Git (`git status` should
      not show it — confirm `.gitignore` is working).
- [ ] `MONGODB_URI` points at a real Atlas cluster, not `<username>:<password>` placeholders.
- [ ] `JWT_SECRET` is a unique random string you generated (not the example in `.env.example`).
- [ ] `frontend/.env` `VITE_API_URL` points at the deployed backend, not `localhost`.
- [ ] Registered a test account on the deployed app and confirmed Demo Mode connects
      and populates the dashboard within ~10 seconds.
- [ ] Confirmed at least one alert or recommendation appears after a few minutes
      (the scheduler runs every 5 minutes by default — `MONITORING_CRON` in `.env`).
- [ ] If email alerts matter to the client: sent yourself a test alert and confirmed
      it actually arrives (not just logged to console).
- [ ] Decided with the client whether Demo Mode alone is being delivered, or whether
      AWS/OCI live integration is part of this delivery (and if so, budgeted time for
      Section 3/4 above — that's real backend work, not configuration).
- [ ] Rate limiting, CORS, and Helmet are already on by default — just confirm
      `CLIENT_URL` in production doesn't accidentally allow `*`.
- [ ] Decided who owns the MongoDB Atlas / Render / Vercel accounts going forward —
      your accounts or the client's. If it's the client's, transfer ownership or
      hand over credentials through a secure channel (not email/WhatsApp in plaintext).
- [ ] If deploying OCI live mode: the private key file referenced by
      `OCI_PRIVATE_KEY_PATH` needs to actually exist on whatever server/container runs
      the backend — it can't just be an env var, since it's a file path. On Render this
      means using a Secret File; in Docker this means mounting it as a volume. Don't
      commit the key itself to the repo.
- [ ] Ran `docker compose up --build` locally at least once (or deployed via the
      Render Blueprint) to confirm the app works against a **real** database — the
      code was verified extensively without one in the build environment, so this is
      a genuine first real-world checkpoint, not a formality.

---

## What I already verified on my side (so you don't have to re-check it)

- All 65 backend source files pass `node --check` (no syntax errors).
- `npm install` succeeds cleanly for both backend and frontend with the pinned versions,
  including the newly-added `@aws-sdk/client-*` packages and `oci-sdk`.
- The frontend builds successfully via `vite build` with no errors.
- Backend boots and serves `/health` correctly even with no database configured, and every
  route (including the new `/api/notifications` and `/api/regions`) mounts and responds
  correctly (401 for unauthenticated requests, not a crash).
- Ran the core logic as unit tests (no database needed) and confirmed:
  - AWS-shaped and OCI-shaped raw metrics both normalize into the identical canonical
    schema (the central research claim of the project).
  - The normalizer correctly rejects out-of-range values (e.g. negative CPU).
  - The health-scoring engine's classification thresholds behave as documented
    (EXCELLENT/HEALTHY/WARNING/CRITICAL boundaries).
  - The Demo Adapter generates the expected 18 resources (10 AWS-style + 8 OCI-style)
    and produces metrics that pass normalization and validation.
  - The efficiency engine handles zero-cost / zero-resource edge cases without dividing by zero.
  - `AWSAdapter` and `OCIAdapter` correctly report "not configured" with a clear message
    when no credentials are present, and the AWS SDK v3 / `oci-sdk` packages they depend
    on are confirmed importable.
  - The `CloudAccount` schema's unique `(userId, provider)` index is correctly registered
    (the fix for bug #3 above).
- Re-ran the full syntax check (65 backend files) and a full app-boot test after every fix
  in this pass — nothing broke.
- `docker-compose.yml` and `render.yaml` both pass YAML validation.
- Confirmed `frontend/public/_redirects` is correctly copied into the production build
  output by Vite (`dist/_redirects` present after `npm run build`).

### Convenience: seed a demo account in one command
Once `MONGODB_URI` is set, run this inside `backend/` to get a ready-to-login account with
live demo data instead of clicking through the UI:
```bash
npm run seed:demo
```
It prints the login email/password it created (defaults to `demo@cloudviz.local` /
`demopassword123` — override with `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` in `.env`).

**What I could not test in this environment:** a live run against a real MongoDB
instance and a live run of the full request→response API flow, because this sandbox
has no network access to MongoDB's download servers or Atlas. Everything above gives
strong confidence the wiring is correct, but you should still do a real end-to-end
pass locally (Section "Quick start" in the README) before showing it to the client —
budget 15–20 minutes for that, not as a formality but as a genuine first real run.
