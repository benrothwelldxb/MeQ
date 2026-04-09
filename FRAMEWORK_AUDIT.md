# MeQ Framework Generalisation Audit

## Summary

The codebase has **~25 files** with hardcoded assumptions about 5 specific MeQ domains. The Framework system exists but is incomplete — legacy domain columns and constants still dominate.

## Hardcoded Assumptions Found

### 1. Constants (CRITICAL) — `src/lib/constants.ts`
- `DOMAINS` array: hardcoded 5-element array
- `DOMAIN_LABELS`, `DOMAIN_COLORS`, `DOMAIN_DESCRIPTIONS` (+ junior variants): keyed to 5 domains
- `CASEL_ALIGNMENT`: hardcoded CASEL mapping
- `STRENGTH_MESSAGES`, `NEXT_STEPS` (+ junior variants): messages per domain
- Level thresholds: `LEVEL_THRESHOLDS`, `JUNIOR_LEVEL_THRESHOLDS`, `OVERALL_LEVEL_THRESHOLDS` + reduced variants
- Max scores: `MAX_DOMAIN_SCORE`, `MAX_TOTAL_SCORE` + reduced variants

### 2. Schema (CRITICAL) — `prisma/schema.prisma`
- Assessment model: 10 hardcoded columns (knowMeScore, knowMeLevel, manageMeScore, etc.)
- TeacherAssessment model: same 10 hardcoded columns
- JSON fields exist (`domainScoresJson`, `domainLevelsJson`) but are secondary

### 3. Score Field Writes (CRITICAL)
- `src/app/actions/quiz.ts`: writes to all 10 legacy columns + JSON fields (double write)
- `src/app/actions/teacher-assessment.ts`: writes to all 10 legacy columns

### 4. Score Field Reads (CRITICAL) — 6 files
- `src/app/results/page.tsx`: reads legacy columns as fallback
- `src/app/admin/(authenticated)/results/[id]/page.tsx`: reads legacy columns as fallback
- `src/app/teacher/(authenticated)/class/[classGroupId]/page.tsx`: hardcoded domain totals
- `src/app/teacher/(authenticated)/class/[classGroupId]/report/page.tsx`: same
- `src/app/api/results/export/route.ts`: hardcoded CSV headers and row values
- `src/lib/progress.ts`: hardcoded domain score reads

### 5. Layout Assumptions (HIGH)
- `grid-cols-5` in teacher class results page
- `colSpan={5}` or `colSpan={6}` in 4 files (assumes 5 domains)
- `slice(0, 2)` for "top 2 strengths" in 5 places

### 6. Seed Data (MEDIUM)
- 60 questions hardcoded by domain name
- 80 interventions keyed to 5 domains
- 10 pulse questions keyed to 5 domains

## What's Already Framework-Ready
- Framework, FrameworkDomain, FrameworkQuestion models exist
- Framework config JSON stores thresholds, levels, messages
- School.frameworkId links to chosen framework
- Quiz page loads FrameworkQuestion when custom framework set
- Framework scoring calculates dynamically from domain list
- Results page reads domainScoresJson when available
- Framework builder UI exists in super admin

## What Blocks Full Flexibility
1. Legacy score columns still written and read as primary source
2. Constants file still imported in 10+ files
3. Grid layouts assume exactly 5 domains
4. "Top 2 strengths" logic hardcoded
5. CSV export hardcoded to 5 domains
6. Teacher assessment scoring not framework-aware
7. Intervention queries use domain name strings matching legacy names
