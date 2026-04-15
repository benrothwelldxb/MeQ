# MeQ Improvement Sprints

Prioritised from the architecture / security / feature / UX deep dive on 2026-04-15.

---

## Sprint 1 — Security hardening + two small wins (ACTIVE)

**Goal:** close the IDOR vulnerabilities discovered in the audit and ship two high-ROI UX wins (first-run checklist, student PDF).

### 1.1 Security fixes (all IDOR / auth gaps)

- [ ] Student mutations — add school ownership check to `deleteStudent`, `updateStudent`, `bulkDeleteStudents`, `bulkReassignClass`, `resetAssessment` in `src/app/actions/students.ts`
- [ ] Survey mutations — add survey ownership check (`survey.schoolId === session.schoolId`) to `updateSurvey`, `addSurveyQuestion`, `deleteSurveyQuestion`, `activateSurvey`, `closeSurvey`, `deleteSurvey`, `resetSurveyForStudent` in `src/app/actions/surveys.ts`
- [ ] `deleteClassGroup` and `createClassGroup` — add ownership checks in `src/app/actions/class-groups.ts`
- [ ] Student login rate limiting — use `FailedLoginAttempt` on the student login path in `src/app/actions/auth.ts`
- [ ] Session secret: throw in production if `SESSION_SECRET` missing
- [ ] Bcrypt cost 10 → 12 (admin-manage, teachers, super-admin-manage, schools, password-reset)
- [ ] Strip email addresses from `console.log` / `console.error` in `src/lib/email.ts` and manage actions

### 1.2 Admin first-run checklist

- [ ] On `/admin`, show a setup checklist card when the school is new: year groups → teachers → students → framework → first assessment deployed. Dismissible, and each completed step auto-ticks.

### 1.3 Student PDF report

- [ ] Add a "Download PDF" button on the admin student 360 profile (`/admin/students/[id]`) that opens a print-friendly view using `@media print`.

---

## Sprint 2 — Teacher workflow, SLT insight, end-of-year hygiene

**Goal:** complete the teacher/SLT reporting loop and make the summer rollover frictionless.

- [ ] Academic year rollover — admin action "Archive 2025-2026, start 2026-2027". Soft-archive old assessments, reset term to term1, unlock framework editing.
- [ ] Intervention impact tracking — `InterventionLog(teacherId, studentId, interventionId, appliedAt, notes)` + UI to mark an intervention applied from the student 360 page. Show delta in scores next term.
- [ ] Term-over-term trend charts on `/admin/slt` — Recharts line chart per domain with level-band backgrounds.
- [ ] Cohort tracking — follow a year group through multiple academic years.
- [ ] Class-to-class comparison page at `/admin/slt/class-comparison`.
- [ ] Teacher bulk CSV upload at `/admin/teachers/upload` (mirror student upload).
- [ ] Weekly SLT digest email — Friday 8am cron via Resend.
- [ ] Session-expiry warning modal at 7h 55m.

---

## Sprint 3 — Growth + accessibility

**Goal:** differentiate against competitors and open the UAE and UK primary markets.

- [ ] Student return visits — persistent student login, read-only history dashboard with trend charts and pulse history.
- [ ] Dyslexia-friendly font toggle (OpenDyslexic) on student quiz UI.
- [ ] High-contrast mode toggle on student quiz UI.
- [ ] GDPR export — download-all-data button per student (CSV + JSON).
- [ ] Audit log — `AuditLog(adminId, action, entityType, entityId, schoolId, createdAt, meta)` recorded for all destructive actions.
- [ ] Ofsted-ready school summary PDF.
- [ ] In-app notifications — bell icon + toast, read/unread state. Start with safeguarding alerts + deploy confirmations.

---

## Sprint 4 — Integrations + i18n (strategic bets)

**Goal:** unblock adoption by integrating with the systems schools already use, and translate the UI for UAE.

- [ ] Wonde MIS integration — auto-sync students, teachers, classes from SIMS/Arbor/Bromcom. Weekly cron + manual refresh button.
- [ ] Multilingual UI infrastructure (next-intl) — English + Arabic, RTL layout.
- [ ] Parent portal MVP — email-code login, view own child's latest results + trend.
- [ ] Read-aloud audio + symbol library — populate existing `audioUrl` / `symbolImageUrl` fields on framework questions with real content.
- [ ] MAT / trust-level dashboard — aggregate view across schools for an admin with multiple campuses.

---

## Technical debt (ongoing background — slip into sprints as related files are touched)

- Type-safe JSON.parse helper (Zod-backed) — replace `JSON.parse(x) as T` across the 20+ files that do it.
- Drop legacy domain score columns on `Assessment` once nothing reads them.
- `Promise.all` sequential awaits in `quiz.ts:165`, `framework-import.ts:77`.
- Postgres enums for string-union fields (status, type, tier, audience, level).
- Vitest test suite — start with scoring functions + ownership checks.
- Prisma 5 → 7 upgrade when we hit a free moment.
