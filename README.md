# MeQ - Emotional Skills Assessment

A child-friendly emotional skills assessment for ages 8-11. Students log in with unique codes, complete a 40-question quiz across 5 emotional domains, and receive immediate scored results.

## Setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

- **Test Student Code:** `TESTAB23`
- **Admin Login:** `admin` / `meq-admin-2026` at [/admin/login](http://localhost:3000/admin/login)

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
- **Levels**: Emerging (0-39%), Developing (40-59%), Secure (60-79%), Advanced (80-100%)
- **Reliability**: High/Medium/Low based on validation pair consistency and trap question responses

## Stack

- Next.js 14 (App Router)
- TypeScript, React, Tailwind CSS
- Prisma + SQLite
- iron-session for auth

## Limitations

- Single admin account (MVP)
- SQLite (not suitable for concurrent production use)
- No password reset
- No export of full results dataset (individual CSV of login codes available)
