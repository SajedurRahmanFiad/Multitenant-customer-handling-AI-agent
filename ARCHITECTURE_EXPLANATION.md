# Current application architecture

## Frontend

The browser application is React 19 with TypeScript, Vite, and React Router. `src/main.tsx` provides the router, authentication context, and currency context. `src/App.tsx` owns the authenticated layout, tenant selection, and page routes. Feature pages live in `src/pages/`; reusable page sections live in `src/components/`.

The shared HTTP client is `src/lib/api.ts`. It sends the saved bearer token and selected tenant ID to the PHP API. `src/hooks/useApiData.ts` loads read-only endpoint data and exposes a reload callback. Feature writes should use `api.post`, `api.put`, `api.patch`, or `api.del`, then refresh the affected query.

## Backend and persistence

The backend is plain PHP 8.1+ with PDO and no Composer dependencies. `backend/public/index.php` loads configuration, ensures the schema, applies CORS and authentication, and dispatches routes from `backend/routes/api.php`. Controllers validate requests and enforce tenant scoping. Shared services handle authentication, audit events, uploads, billing, background jobs, knowledge indexing, and optional language-model requests.

SQLite is the local development database (`backend/database/app.sqlite` by default). MySQL is supported for deployment. The matching schema files are in `backend/database/`; `backend/src/Core/Database.php` applies migrations and `backend/database/seed.php` can add demo tenant records. Do not run the seeder with `--fresh` against a database whose contents need to be retained: that option drops tables.

Background work is queued in the database and processed by `backend/worker.php`. Run the worker locally while developing features that enqueue indexing or message jobs. External provider calls require credentials in the backend's ignored `.env` file; local development can use the built-in mock provider.

## Local startup

1. Copy `backend/.env.example` to `backend/.env` if the local configuration is missing. The example uses SQLite.
2. Start the API from the repository root with `php -S 127.0.0.1:8000 -t backend/public`.
3. Start the frontend with `npm run dev`.
4. For queued indexing tasks, run `php backend/worker.php` in another terminal.

The frontend API base can be set with `VITE_API_URL`; without it, the client uses `http://127.0.0.1:8000`.

## Workflow boundary

Authentication, tenant selection, team administration, inbox operations, knowledge records, channels, settings, billing, and platform administration belong to the application backend. The main customer-handling AI workflow and its orchestration architecture are intentionally deferred. Screens that would depend on that workflow must not claim a simulated reply, test, or provider operation completed successfully.
