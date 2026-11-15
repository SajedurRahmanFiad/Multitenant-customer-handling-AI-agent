# AI Support Platform — PHP Backend

Plain-PHP 8 backend (no framework, no Composer dependencies) for the multitenant
AI customer-handling platform. Works on cPanel / shared hosting.

## Requirements
- PHP 8.1+ with `pdo_mysql` (production) **or** `pdo_sqlite` (local dev)
- `curl` + `openssl` + `mbstring` extensions
- MySQL 5.7+/8 (production) or SQLite (dev)

## Quick start (local, Windows/Linux)
```bash
cd backend
copy .env.example .env      # linux: cp .env.example .env
# .env already defaults to DB_DRIVER=sqlite

# create schema + demo data (ten_loom_01, users, conversations, knowledge...)
php database/seed.php --fresh

# start dev server
php -S localhost:8000 -t public

# in another terminal — process queued jobs
php worker.php
```

Demo login: phone `+880 1711-000001`, password `password123`.
Demo ingest API key: `ak_demo_ten_loom_01`.

## Production (cPanel)
1. Upload the `backend/` folder (e.g. into `public_html/api/`).
2. Create a MySQL database + user in cPanel, grant all privileges.
3. Edit `.env`: set `DB_DRIVER=mysql`, `DB_HOST=localhost`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
   and a strong random `PLATFORM_TOKEN`.
4. Point `.htaccess`-routed requests at `public/` (already handled by `backend/.htaccess`).
   API base URL becomes `https://yourdomain.com/api/`.
5. Seed once: `php database/seed.php` (CLI or via cPanel "Terminal").
6. Cron job (every minute): `php /home/USER/public_html/api/worker.php`
7. If the host doesn't rewrite to `public/`, set the vhost DocumentRoot to
   `backend/public` — `public/index.php` is the only web entry point.

## Meta business channel connections

Set `META_APP_ID`, `META_APP_SECRET`, `META_MESSENGER_CONFIG_ID`,
`META_WHATSAPP_CONFIG_ID`, `APP_URL` (the public backend base URL), and
`FRONTEND_URL` (the frontend origin) in the backend `.env`. In Meta App
Dashboard, use a Business app with Facebook Login for Business, create separate
configurations for Messenger Pages and WhatsApp business assets, and register
`{APP_URL}/channels/meta/callback` as an allowed OAuth redirect URI. Grant the
permissions required by each configuration and complete Meta App Review /
Advanced Access before onboarding businesses outside your own test accounts.
The app ties OAuth state to the logged-in tenant and exchanges the code on the
server. Credentials are encrypted at rest using a key derived from
`META_APP_SECRET`; keep that secret stable or existing channels will need to
reconnect. WhatsApp assets must be granted to the business configuration.

## Directory layout
```
backend/
├── public/index.php        front controller (CORS, auth middleware, routing)
├── routes/api.php          full route table
├── src/Core/               Database, Router, Request, Response, Validator, Util, Http, Uploads
├── src/Auth/               AuthService, AuthContext, Permissions
├── src/Controllers/        one per frontend page/module
├── src/Services/           Orchestrator (AI pipeline), Knowledge (RAG), LLM providers, Billing, Jobs...
├── database/               schema.mysql.sql, schema.sqlite.sql, seed.php
├── storage/uploads/        uploaded files (served via /storage/uploads/*)
├── worker.php              cron worker for the job queue
└── bootstrap.php           CLI/shared class loader
```

## Key endpoints (Bearer token after login)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Overview | `GET /overview/metrics`, `/overview/conversations-timeline`, `/overview/recent`, `/overview/analytics` |
| Inbox | `GET /inbox/conversations`, `GET /inbox/conversations/{id}/messages`, `POST .../messages`, `PATCH .../status` |
| Knowledge | `GET /knowledge/summary`, `/knowledge/sources`, `/knowledge/faqs`, `/knowledge/products`, `/knowledge/policies`, `/knowledge/brand` |
| Agent | `GET /agent/config`, `POST /agent/config/publish`, `/agent/tools`, `/agent/quick-templates`, `/agent/handover-rules`, `/agent/test` |
| Channels | `GET /channels/status`, `/channels/messenger`, `/channels/whatsapp`, `/channels/webhooks`, `/channels/integrations` |
| Settings | `GET /settings/profile`, `/settings/team`, `/settings/escalations`, `/settings/notifications`, `/settings/retention` |
| Billing | `GET /billing/plan`, `/billing/invoices`, `/billing/wallet`, `POST /billing/topup`, `/billing/usage` |
| Platform | `GET /platform/stats`, `/platform/tenants`, `POST /platform/tenants`, `/platform/components`, `/platform/incidents`, ... |
| Public ingest | `POST /ingest/message` (`X-Api-Key: ak_demo_...`), `POST /ingest/conversations/create` |
| Webhooks | `GET /webhooks/messenger`, `POST /webhooks/{channel}` |
| Ops | `GET /jobs`, `POST /jobs/{id}/retry` |

## Demo tenants
| Tenant | Slug | Users |
|---|---|---|
| Bengal Loom & Crafts | `bengal-loom-crafts` | usr_02 (admin), usr_03/04 (agents) |
| Gadget Express BD | `gadget-express-bd` | usr_07 (admin), usr_08 (agent) |
| Dhaka Pharma & Care | `dhaka-pharma-care` | usr_10 (admin) |

Platform super admin: usr_01 (tenant-independent). All seeded users share password
`password123`. Super admins may add `?tenant=<id>` or an `X-Tenant-ID` header to
operate on a selected tenant.

## AI providers
`LLMFactory` picks by model id: Gemini (`GEMINI_API_KEY`), OpenAI-compatible
(OpenAI/Groq via `OPENAI_API_KEY`/`GROQ_API_KEY`), Anthropic, Ollama
(`OLLAMA_URL`). Without keys it falls back to the deterministic **MockProvider**
so the whole pipeline (RAG retrieval → prompt → moderation → reply) works offline.

## Job queue
Kinds: `process_message`, `reindex_document`, `deliver_delayed_reply`,
`sync_integration`, `follow_up_message`, `training_job`.
`worker.php` claims pending jobs (`jobs.locked_by/at`), executes, retries with
backoff, and sweeps stale locks. Failed jobs land in the platform-admin DLQ.
