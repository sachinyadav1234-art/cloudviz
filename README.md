# CloudViz

Provider-Agnostic Multi-Cloud Resource Intelligence and Optimization Framework.

CloudViz connects AWS and Oracle Cloud (with a zero-cost Demo Mode included), normalizes
their heterogeneous telemetry into one canonical model, stores historical metrics, and
generates health scores, anomaly detections, threshold alerts and explainable optimization
recommendations through a single React dashboard.

This build implements the full V1 pipeline end-to-end. **Demo Mode** works immediately with
no credentials. **AWS and OCI adapters are fully implemented** against the AWS SDK v3
(`@aws-sdk/client-ec2`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-sts`,
`@aws-sdk/client-cost-explorer`) and `oci-sdk` — they activate automatically the moment you
add real credentials to `backend/.env`. See
`backend/src/providers/aws/AWSAdapter.js` and `backend/src/providers/oci/OCIAdapter.js`.

## Project layout

```
cloudviz/
├── backend/     Node.js + Express + MongoDB API, scheduler, and analytics engines
├── frontend/    React + Vite + Tailwind dashboard
└── DELIVERY_CHECKLIST.md   <- Read this before handing the app to your client
```

## Quick start (local development)

### Option A — Docker Compose (recommended, includes a real MongoDB)

This is the fastest way to get a fully working local stack — including a real
MongoDB instance, which matters because it's the one thing that couldn't be
tested inside the sandboxed environment this app was built in.

```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/health

This uses `NODE_ENV=development` with a throwaway JWT secret and a local Mongo
container — it's for local testing only, not for production deployment.

### Option B — Run backend and frontend directly

#### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env — at minimum set MONGODB_URI and JWT_SECRET (see DELIVERY_CHECKLIST.md)
npm install
npm run dev
```

Backend runs at `http://localhost:5000`. Check `http://localhost:5000/health`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL should point at your backend, e.g. http://localhost:5000/api
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Try it

1. Open `http://localhost:5173`, register an account.
2. Go to **Providers** → click **Connect** under **Demo Mode**.
3. Within a few seconds, resources, metrics, health scores, and (once enough history
   accumulates) alerts and recommendations will start appearing across the dashboard.
4. AWS/OCI connect buttons are wired up too and the adapters are fully implemented against
   real cloud APIs — they'll actually connect once you add credentials to `backend/.env`
   (see `DELIVERY_CHECKLIST.md` Sections 3-4).

## What's implemented

- JWT authentication (register/login/me), with audit logging (login, register, cloud connect/disconnect/sync)
- Cloud account connect/test/sync/disconnect — **Demo, AWS, and OCI adapters are all fully coded**
- Resource discovery + canonical normalization (AWS/OCI/Demo → one schema)
- Historical metric storage + validation (invalid data rejected, missing data stored as `null`)
- Health scoring engine (documented, versioned, weighted model)
- Anomaly detection (moving average + standard deviation baseline)
- Alert engine with deduplication, lifecycle (ACTIVE → ACKNOWLEDGED → RESOLVED), and email/console notifications
- In-app notification center (bell icon, unread count, mark read/mark all read)
- Explainable recommendation engine (under-utilization, over-utilization, storage pressure)
- Cost module (demo cost data + live AWS Cost Explorer / OCI Usage API wiring)
- Cross-cloud comparison analytics, including an experimental efficiency score
- Region distribution view
- Audit log collection (per BACKEND_SCHEMA.md Section 51-52)
- Scheduler (node-cron, overlap-protected) running the full monitoring cycle automatically
- Full React dashboard: Login/Register, Dashboard, Providers, Resources, Resource Details
  (with charts), Analytics, Alerts, Cost, Optimization, Regions, Settings, Notifications
- `npm run seed:demo` — one command to get a ready-to-login demo account with live data

## What still needs YOUR credentials to fully activate

The code for AWS and OCI is complete and uses only read-only API calls, but it obviously
cannot be tested against real infrastructure without your accounts:

- **AWS** — set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` in `backend/.env`.
  Uses EC2 `DescribeInstances`, CloudWatch `GetMetricData`, and (only if you opt in via
  `AWS_ENABLE_COST_EXPLORER=true`) Cost Explorer `GetCostAndUsage`.
- **OCI** — set `OCI_TENANCY` / `OCI_USER_ID` / `OCI_FINGERPRINT` / `OCI_PRIVATE_KEY_PATH` /
  `OCI_REGION`. Uses the Compute, Monitoring, Identity, and Usage API clients from `oci-sdk`.
- **Outbound email** — falls back to console logging until SMTP is configured.

See `DELIVERY_CHECKLIST.md` for exactly what to fill in, the required IAM permissions, and why.

## Deployment

This repo includes ready-to-use deployment configuration:

- **`docker-compose.yml`** (root) — full local stack with real MongoDB, for local testing.
- **`backend/Dockerfile`** — production container image for the API (Node 18 Alpine, non-root
  runtime deps only, built-in `/health` healthcheck).
- **`frontend/Dockerfile`** + **`frontend/nginx.conf`** — multi-stage build that compiles the
  React app and serves it via nginx with SPA routing fallback configured.
- **`render.yaml`** — a Render Blueprint that provisions both the backend web service and the
  frontend static site in one step. You'll still need to fill in secret env vars (`MONGODB_URI`,
  `JWT_SECRET`, etc.) in the Render dashboard afterward — see comments in the file.
- **`frontend/vercel.json`** and **`frontend/public/_redirects`** — SPA routing fallback rules
  for Vercel and for Netlify/Render static hosting respectively, so refreshing a deep link like
  `/resources/<id>` doesn't 404.

Full step-by-step deployment instructions (accounts to create, exact values to set) are in
`DELIVERY_CHECKLIST.md`.
