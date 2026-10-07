#!/usr/bin/env bash
# RecruitIQ — apply database migrations on the live server (recruitiq.hanaplatform.com).
#
# Run on the server from the project root:
#   chmod +x scripts/migrate-live.sh && ./scripts/migrate-live.sh
#
# What it does:
#   1. backs up the live database (backups/<db>-<time>-before-migrate/, read-only)
#   2. shows the pending migrations
#   3. applies them (scripts/migrate-deploy.mjs — the same step deploy.sh runs)
#   4. turns the /live-demo logins on: DEMO_PAGE=true in .env, and sets the demo
#      accounts' password to DEMO_PASSWORD (only the 5 *.demo logins)
#   5. restarts the app in pm2 and checks it is healthy
#
# Optional env vars:
#   PULL=1        git pull + npm ci + npm run build first (new code / new migration files)
#   SKIP_BACKUP=1 skip the backup (not recommended)
#   SKIP_DEMO=1   don't touch DEMO_PAGE or the demo passwords
#   YES=1         don't ask for confirmation
set -euo pipefail

APP_NAME="recruitiq"
PORT=2020
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

log()  { echo -e "\033[1;36m==>\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
die()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

# Sets KEY=VALUE in .env (replaces an existing line, or appends one).
set_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

# ── 0. Checks ───────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || die "Node.js is not installed."
[ -f .env ] || die "No .env in $APP_DIR."
grep -q '^DATABASE_URL=' .env || die "DATABASE_URL is not set in .env."
[ -d node_modules/@prisma/client ] || die "Dependencies missing — run: npm ci --include=dev  (or PULL=1 $0)"

DB_HOST="$(grep '^DATABASE_URL=' .env | sed -E 's#.*@([^/:]+).*#\1#')"
log "Database host: $DB_HOST"
if [ "${YES:-0}" != "1" ]; then
  read -r -p "Apply migrations to this database? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || die "Cancelled."
fi

# ── 1. Optional: update code first ──────────────────────────────────
if [ "${PULL:-0}" = "1" ]; then
  log "Pulling latest code"
  git pull --ff-only
  log "Installing dependencies"
  npm ci --include=dev
  log "Building Next.js app + Prisma client"
  npm run build
  [ -f .next/BUILD_ID ] || die "Build did not produce .next/BUILD_ID."
fi

# ── 2. Backup ───────────────────────────────────────────────────────
if [ "${SKIP_BACKUP:-0}" != "1" ]; then
  log "Backing up the database (read-only)"
  node scripts/backup-db.mjs before-migrate || die "Backup failed — nothing was changed. Fix it or run with SKIP_BACKUP=1."
else
  warn "Skipping the backup (SKIP_BACKUP=1)"
fi

# ── 3. Pending migrations ───────────────────────────────────────────
log "Migration status"
npx prisma migrate status || true   # exits non-zero while migrations are pending

# ── 4. Apply ────────────────────────────────────────────────────────
log "Applying migrations"
node scripts/migrate-deploy.mjs
npx prisma migrate status

# ── 5. Demo logins (/live-demo) ─────────────────────────────────────
if [ "${SKIP_DEMO:-0}" != "1" ]; then
  log "Turning the demo logins on"
  cp .env ".env.bak-$(date +%Y%m%d-%H%M%S)"
  set_env DEMO_PAGE true
  if ! grep -q '^DEMO_PASSWORD=.\+' .env; then
    warn "DEMO_PASSWORD is not set in .env — the demo accounts will use the default 'Demo@123'."
  fi
  # Same password the page shows, for the 5 demo logins only (never real accounts).
  npx tsx scripts/set-demo-password.mjs
fi

# ── 6. Restart + health check ───────────────────────────────────────
if command -v pm2 >/dev/null 2>&1 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Restarting $APP_NAME"
  pm2 restart "$APP_NAME" --update-env >/dev/null
  pm2 save >/dev/null
else
  warn "pm2 process '$APP_NAME' not found — start the app with ./deploy.sh"
  exit 0
fi

log "Waiting for health check"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    log "App is up: http://127.0.0.1:$PORT"
    break
  fi
  [ "$i" -eq 30 ] && { pm2 logs "$APP_NAME" --lines 50 --nostream; die "App did not respond on port $PORT."; }
  sleep 1
done

if [ "${SKIP_DEMO:-0}" != "1" ]; then
  if curl -fsS "http://127.0.0.1:$PORT/api/v1/config/demo" | grep -q '"enabled":true'; then
    log "Demo page is on: https://recruitiq.hanaplatform.com/live-demo"
  else
    warn "The demo page still reports enabled=false — check DEMO_PAGE in .env."
  fi
fi

log "Done."
