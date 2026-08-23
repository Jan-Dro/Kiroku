# Kiroku

Kiroku is a self-hosted vehicle journal for fuel, service, expenses, upgrades, notes, documents, reminders, and analytics. It runs as one container with SQLite and local file storage; PostgreSQL, Redis, and external database services are not required.

## Storage architecture

All persistent container data is beneath `/app/data`:

```text
/app/data/
├── auth-secret
├── kiroku.db
└── uploads/
    ├── documents/
    └── vehicle-images/
```

Mounting `/app/data` preserves accounts, sessions, vehicles, records, images, and documents across container recreation and image updates. On startup, the container creates required directories, fixes ownership for UID/GID `10001`, applies pending non-destructive Prisma migrations, and starts Kiroku as that unprivileged user.

If `AUTH_SECRET` is omitted, Kiroku creates a cryptographically secure secret at `/app/data/auth-secret` with restrictive file permissions. It reuses that file on every future start and never replaces an existing secret. An explicitly configured `AUTH_SECRET` takes precedence; `SESSION_SECRET` remains supported for existing installations.

## CasaOS custom install

In CasaOS, choose **App Store → Custom Install** and configure:

| Setting | Value |
| --- | --- |
| Image | `ghcr.io/<owner>/kiroku:latest` |
| Host port | `3000`, or any available port |
| Container port | `3000/TCP` |
| Host volume | `/DATA/AppData/kiroku/data` |
| Container volume | `/app/data` |
| Required environment | None |

Optional environment variables:

- `APP_URL=http://<server-ip>:<host-port>` (use the public `https://` URL when behind HTTPS)
- `AUTH_SECRET=<explicit secret of at least 32 characters>`
- `REGISTRATION_ENABLED=true`
- `MAX_UPLOAD_SIZE_MB=10`

Open `http://<server-ip>:<host-port>` after the health check succeeds. HTTPS, reverse proxies, and Tailscale remain external to Kiroku and are not required to start it. The first registered account uses the existing local authentication flow.

If you prefer to manage the secret externally, generate one on Linux with:

```bash
openssl rand -hex 32
```

## Docker Compose

Compose is optional. Copy `.env.example` to `.env`, replace `<github-username>` in `docker-compose.yml`, then run:

```bash
docker compose pull
docker compose up -d
```

The included Compose file runs only Kiroku and stores data in `./data`. Open `http://localhost:3000`.

To pull without Compose:

```bash
docker pull ghcr.io/<owner>/kiroku:latest
docker run -d \
  --name kiroku \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /DATA/AppData/kiroku/data:/app/data \
  ghcr.io/<owner>/kiroku:latest
```

For a private GHCR package, authenticate first with a GitHub token that has `read:packages`:

```bash
echo "<github-token>" | docker login ghcr.io -u <owner> --password-stdin
```

## Updates

Compose deployments update with:

```bash
docker compose pull
docker compose up -d
```

In CasaOS, change the image tag to the desired release (for example `v1.2.3`) and recreate the app while retaining the same `/app/data` mount. Startup applies pending migrations automatically. Pinning a release tag is more predictable than relying on CasaOS to refresh `latest`.

## Backups and restore

The safest complete backup is taken while Kiroku is stopped so SQLite has no active writer:

1. Stop the Kiroku container in CasaOS or run `docker compose stop`.
2. Back up the entire `/DATA/AppData/kiroku/data` directory, including `auth-secret` and hidden SQLite journal files if present.
3. Start Kiroku again with `docker compose start` or from CasaOS.

For an online database backup, use SQLite's backup API or `VACUUM INTO` from a compatible SQLite tool, then separately copy `uploads/`. Do not assume copying only an actively written `kiroku.db` is consistent, especially if `kiroku.db-wal` and `kiroku.db-shm` exist.

To restore:

1. Stop Kiroku.
2. Replace the contents of `/DATA/AppData/kiroku/data` with the backup.
3. Ensure CasaOS still mounts that directory at `/app/data`.
4. Start Kiroku. The container will normalize ownership and apply any newer migrations.

## GHCR publishing

The workflow at `.github/workflows/publish-image.yml` publishes multi-platform `linux/amd64` and `linux/arm64` images using Docker Buildx and GitHub Actions cache.

- A push to `main` publishes `ghcr.io/<owner>/kiroku:latest`.
- A tag such as `v1.2.3` publishes semantic version tags.
- The repository `GITHUB_TOKEN` authenticates with `packages: write`; no application secrets enter the image.

To enable publishing:

1. Push the repository to GitHub with Actions enabled.
2. Allow GitHub Actions read/write workflow permissions if repository policy restricts package writes.
3. Push `main` or a semantic version tag.
4. On the first successful run, open the package settings and make it public for anonymous pulls, or keep it private and authenticate clients.
5. Optionally set repository variable `GHCR_IMAGE_NAME` to override the default image path.

## Local development

Local development also uses SQLite. No database server is needed.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The example configuration stores the development database in `data/kiroku.db` and uploads in `data/uploads`. Seed data is optional and destructive to the selected development database:

```bash
npm run db:seed
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The health endpoint is `/api/health`. It verifies that the application can query SQLite and returns only an `ok` flag and timestamp.
