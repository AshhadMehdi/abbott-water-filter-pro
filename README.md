Abbott Water Filters — Project scaffold

Database migration: migrations/001_init.sql

Frontend: frontend/

Quick start (frontend):

1. cd frontend
2. npm install
3. npm run dev

Notes:
- The frontend is a Vite + React scaffold using Tailwind CSS, Framer Motion, and Lucide Icons.
- Replace `logo.jpeg` and `slip.jpeg` in `frontend/public/` as needed.
- The SQL migration expects a Supabase-style `auth.users` table for `profiles.id`.

Backend (optional, local Postgres):

1. Create a Postgres database and update `backend/.env.example` -> `.env` with `DATABASE_URL`.
2. cd backend
3. npm install
4. npm start

The backend will attempt to run `migrations/001_init.sql` on startup and expose:
- `GET /api/profiles` — list profiles
- `GET /api/profiles/:employee_id` — lookup profile by employee id
- `GET /api/customers` — list customers
- `POST /api/customers` — create customer
Additional endpoints:
- `GET /api/jobs` — list jobs
- `POST /api/jobs` — create job
- `PUT /api/jobs/:id` — update job
- `DELETE /api/jobs/:id` — delete job
- `GET /api/inventory` — list inventory
- `POST /api/inventory` — create inventory item
- `PUT /api/inventory/:id` — update inventory
- `DELETE /api/inventory/:id` — delete inventory
- `GET /api/feedback` — list feedback
- `POST /api/feedback` — create feedback
- `GET /api/whatsapp` — list whatsapp logs
- `POST /api/whatsapp` — create whatsapp log

The frontend will try `http://localhost:4000` by default; if the backend is not available the frontend falls back to a local mock.

Supabase integration notes
Docker Compose (one-command local dev)

1. Create a Supabase project and enable Postgres.
2. Run the `migrations/001_init.sql` in the Supabase SQL editor (this migration includes RLS policies that use `auth.uid()`).
3. Enable Email/Password auth (or your preferred provider).
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `frontend/.env` and restart the dev server.
5. The frontend will use Supabase client automatically for profile lookups and data reads/writes when configured; otherwise it falls back to local backend or mock.

Security note: After migrating to Supabase, verify RLS policies (INSERT/UPDATE/DELETE) for each table to match your intended permission model.

1. Ensure Docker is running.
2. From project root run:

```bash
docker compose up --build
```

This brings up Postgres, the backend (port 4000) and the frontend served on port 80. The backend will run the SQL migration on startup. If you need to reset the database data, remove the Docker volume `abbott_water_filter_projjjjj_db_data` or run:

```bash
docker compose down -v
```

Twilio WhatsApp (optional)

To use real WhatsApp sending via Twilio:

1. Create a Twilio account and enable WhatsApp send capability for the chosen phone number.
2. Add the following variables to `backend/.env` or your host environment before starting the backend:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+1415XXXXXXX  # Twilio WhatsApp-enabled phone
```

3. If using Docker Compose, set the environment variables in your shell or in a `.env` file so they are passed into the backend container.

When Twilio credentials are present, the backend worker will attempt real sends and will retry failed sends with exponential backoff. If Twilio credentials are not provided the worker simulates sends for local testing.
