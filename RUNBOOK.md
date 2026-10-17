# Local development

Use Node.js 24 and Docker Desktop. Install dependencies with `npm ci`.
Keep local credentials in `.env.local`; never copy production data or secrets.
For Next running on the host, configure these local endpoints:

```dotenv
POSTGRES_PORT=55432
DATABASE_URL=postgres://myuser:mypassword@127.0.0.1:55432/mydatabase
CONTAINER_DATABASE_URL=postgres://myuser:mypassword@db:5432/mydatabase
UMAMI_DATABASE_URL=postgres://myuser:mypassword@db:5432/umami
SYSTEM_PROFILER_BASE_URL=http://127.0.0.1:8787
PUBLIC_IMG_VALIDATOR_BASE_URL=http://127.0.0.1:8000
IMG_UPLOAD_DIR=./.data/uploads/images
```

Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the dev URL reported by `dev-up`.
OAuth providers must allow that callback URL. Set a local `AUTH_SECRET` and
`SYSTEM_PROFILER_AUTH_TOKEN` before starting services.

For host-run Next, start only the supporting services:

```sh
docker compose --env-file .env.local -p pi-site-dev up -d --build db ai-img-validator system-profiler docker-proxy
node --env-file=.env.local ./node_modules/drizzle-kit/bin.cjs push
mkdir -p .data/uploads/images
dev-up
```

`dev-up` discovers `scripts/start_dev.sh`, which runs `npm run dev:next` bound to
all interfaces. It owns the server through pm2 and reports a Mini tailnet URL.
The database is a separate local Docker volume. The profiler uses simulated
host and service metrics in development. Analytics is optional and is not started.

Stop supporting services with
`docker compose --env-file .env.local -p pi-site-dev down`.
Stop the HTTP server with `dev-lease stop <lease>` using the token from `dev-up`.

For Next running in Docker, use `npm run dev` and stop with `npm run dev:stop`.
Compose requires `CONTAINER_DATABASE_URL` for web and `UMAMI_DATABASE_URL` for
analytics in every environment, both using `db:5432`. `DATABASE_URL` remains the
host URL for Drizzle and host-run Next. Use the same credentials as `POSTGRES_USER`
and `POSTGRES_PASSWORD`; percent-encode each URI component, including the database
name. Keep connection query options in the complete URL. Missing container URLs
stop Compose before startup. Before updating an existing deployment, add both keys
to its env file; an existing encoded `DATABASE_URL` using `db:5432` can be copied
for `CONTAINER_DATABASE_URL`. Set `UMAMI_DATABASE_URL` to the analytics database.
