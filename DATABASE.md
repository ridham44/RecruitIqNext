# Database migration — live server

## Script to run on the server

Script: `scripts/migrate-live.sh`

### 1. Go to the project folder

```bash
cd /path/to/RecruitIqNext
```

### 2. Pull the latest code

```bash
git pull
```

### 3. Make the script executable (first time only)

```bash
chmod +x scripts/migrate-live.sh
```

### 4. Run the script

```bash
PULL=1 ./scripts/migrate-live.sh
```

Type `y` when it asks `Apply migrations to this database? [y/N]`.

---

## Or run the commands one by one

### 1. Go to the project folder

```bash
cd /path/to/RecruitIqNext
```

### 2. Pull the latest code

```bash
git pull
```

### 3. Install dependencies

```bash
npm ci --include=dev
```

### 4. Build

```bash
npm run build
```

### 5. Back up the database

```bash
node scripts/backup-db.mjs before-migrate
```

### 6. Check pending migrations

```bash
npx prisma migrate status
```

### 7. Apply the migrations

```bash
node scripts/migrate-deploy.mjs
```

### 8. Confirm everything is applied

```bash
npx prisma migrate status
```

### 9. Turn on the demo logins

```bash
grep -q '^DEMO_PAGE=' .env && sed -i 's/^DEMO_PAGE=.*/DEMO_PAGE=true/' .env || echo 'DEMO_PAGE=true' >> .env
npx tsx scripts/set-demo-password.mjs
```

### 10. Restart the app

```bash
pm2 restart recruitiq --update-env
```

### 11. Check the app is running

```bash
curl http://127.0.0.1:2020/api/health
```
