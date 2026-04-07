# MeQ - Emotional Skills Assessment

A child-friendly emotional skills assessment for ages 8-11. Students log in with unique codes, complete a 40-question quiz across 5 emotional domains, and receive immediate scored results.

## Setup

```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string and a session secret
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Railway Deployment

1. Add a **PostgreSQL** service in Railway
2. Set environment variables:
   - `DATABASE_URL` — provided by Railway Postgres plugin
   - `SESSION_SECRET` — a random 32+ character string
3. Build command: `npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build`
4. Start command: `npm start`

## Default Credentials

- **Test Student Code:** `TESTAB23`
- **Admin Login:** `admin` / `meq-admin-2026` at `/admin/login`

## CSV Upload Format

Upload students via `/admin/students/upload`. Required columns:

```csv
first_name,last_name,year_group
Alice,Smith,Year 4
Bob,Jones,Year 5
```

Optional columns: `class_name`, `login_code` (auto-generated if omitted).

## Scoring

- **40 questions**: 25 core, 10 validation, 5 trap
- **5 domains**: Know Me, Manage Me, Understand Others, Work With Others, Choose Well
- **Weights**: scenario (x2), behaviour (x1.5), self-report (x1)
- **Level thresholds** (per domain): 0-9 Emerging, 10-14 Developing, 15-17 Secure, 18+ Advanced
- **Reliability**: High/Medium/Low based on validation pair consistency and trap question responses

## Stack

- Next.js 14 (App Router)
- TypeScript, React, Tailwind CSS
- Prisma + PostgreSQL
- iron-session for auth

## Limitations

- Single admin account (MVP)
- No password reset
- No export of full results dataset (individual CSV of login codes available)
