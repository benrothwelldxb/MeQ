# MeQ Roadmap and Gap Analysis

Date: April 2026

## What's Built

**Core product:**
- Student self-assessment (junior + standard tiers, reduced mode)
- Teacher observation assessments (dual-lens)
- Weekly Pulse check-ins (with free text)
- Staff wellbeing (standalone, privacy-enforced, aggregated reporting)
- Bespoke surveys with 9 templates, moderation, anonymous mode
- Reliability scoring (validation pairs + trap questions)
- Framework system with multiple built-in frameworks + custom via JSON import
- Per-school framework assignment (public / private)
- Intervention library per framework
- Teacher class reports with printable version
- SLT dashboards, term-over-term comparison
- Multi-tenancy, multi-campus, multi-framework

**Infrastructure:**
- Resend email (password reset + welcome)
- UploadThing (images + audio)
- CSV bulk upload for students, questions, interventions, pulse
- JSON import/export for full frameworks
- Free text safeguarding keyword detection

**Auth & accounts:**
- Password reset via email
- Change password flow for all user types
- Multi-campus admin login
- Super admin → School admin → Teacher → Student hierarchy

---

## Gap Analysis

Gaps grouped by impact and priority.

### 🚨 CRITICAL — blocking adoption or compliance

**1. Safeguarding alerts dispatch**
Free-text moderation and pulse flagging both detect concerning responses, but nothing is emailed to the DSL. **Detection without alerting is worse than not detecting** — it means data exists but no one sees it in time.
*Effort: small (2-4 hours). Wires into existing Resend infrastructure.*

**2. GDPR tooling**
- No audit log (who deleted, who accessed)
- No student data export (DSAR support)
- Hard delete only, no archive
UK schools are legally required to support DSARs. A school data protection officer will ask.
*Effort: medium (1-2 days). New audit log model + export endpoint + soft-delete flag.*

**3. Session timeouts + basic security hardening**
No session expiry, no account lockout, no password complexity rules. UK schools (especially those handling wellbeing data) will fail procurement checks on this.
*Effort: small-medium (half day). iron-session has TTL support built in.*

**4. Academic year rollover**
No mechanism to end a school year and start fresh while preserving history. If you run through summer 2026 with no solution, schools starting September will mix prior year data with new year data in confusing ways.
*Effort: medium (1 day). Archive-style flag + rollover action per school.*

### 🔴 HIGH — competitive gaps identified in analysis

**5. CPOMS / MyConcern integration**
Every UK competitor has this. Blocks UK school adoption.
*Effort: large. Requires API docs from CPOMS, probably vendor engagement.*

**6. Wonde MIS integration**
Wonde is the UK abstraction layer — one integration unlocks SIMS/Arbor/Bromcom. Blocks UK school adoption.
*Effort: large. Requires Wonde partnership + roster sync logic.*

**7. Google / Microsoft SSO**
Standard auth expectation. All competitors have it.
*Effort: medium (1-2 days). NextAuth handles the heavy lifting.*

**8. Multilingual UI (starting with Arabic for UAE)**
Critical for international markets. Content is mostly in JSX — would need next-intl setup.
*Effort: medium-large. 3-5 days for setup + Arabic translation + RTL support.*

### 🟡 MEDIUM — meaningful additions

**9. Intervention impact tracking**
"Teacher applied intervention X to Student Y → did their score improve?" Competitors have this.
*Effort: medium (1-2 days). New tracking table + simple UI.*

**10. Bulk CSV upload for teachers**
Mirror the student upload flow for teachers. Common request.
*Effort: small (2-3 hours).*

**11. Printable individual student report (PDF)**
For parents' evenings, SEND reviews, transition packs. Teacher class report exists but individual doesn't.
*Effort: medium (half day). Reuses existing layout with new print styles.*

**12. Populate audio + symbol content for junior MeQ Standard**
Infrastructure is ready — just needs ElevenLabs generation for the 20 junior questions + sourcing/creating Widgit-style symbols.
*Effort: small (content work, not coding). ~$20 of ElevenLabs API.*

**13. Weekly digest email for SLT**
Automated weekly email summarising pulse trends, flagged students, completion rates.
*Effort: medium (1 day). Needs a cron job or scheduled worker.*

**14. Class-to-class comparison within a school**
Year 5A vs Year 5B. Surfaces teaching quality variation.
*Effort: small (half day). Data is already queryable — just needs a comparison UI.*

### 🟢 LOWER PRIORITY — genuine future work

**15. Student dashboard / return visits**
Students currently complete and see results once. Can't log back in later to view history or track progress.
*Effort: medium-large. Changes the student experience model significantly.*

**16. MTSS tier 1/2/3 interventions**
Important for US market, less so UK. Reshape intervention library by tier.
*Effort: medium (1-2 days).*

**17. Longitudinal cohort tracking**
Follow Year 3 cohort through years 4, 5, 6. Data exists but no view surfaces it.
*Effort: small-medium (1 day). Query + view.*

**18. Parent/guardian access**
Panorama has this. Could extend the bespoke survey system to support parent audiences.
*Effort: large. New login type + separate data model considerations.*

**19. AI-driven insights**
Claude API summarising class trends, flagging patterns, suggesting interventions.
*Effort: medium. Once per assessment completion, low ongoing cost.*

**20. National benchmarking**
"Schools on MeQ Standard average 3.4 on ManageMe this term." Needs ~50+ schools of data first.
*Effort: small technically, blocked on data volume.*

**21. Self-led student wellbeing content**
YouHQ's content advantage. CBT modules, mindfulness, relaxation.
*Effort: very large. More of a content business than a tech project.*

**22. Public API**
For schools that want to pull data into their own systems.
*Effort: medium-large. REST/GraphQL layer with auth tokens.*

**23. White-labelling**
School-specific branding (logo, colours).
*Effort: small-medium (1-2 days). Schema + theming layer.*

**24. Setup wizard / onboarding**
First-time admin experience. Currently drops them in a blank settings page.
*Effort: small-medium (1 day).*

### ♿ ACCESSIBILITY gaps

**25. Dyslexia-friendly font option**
Toggle in student settings for OpenDyslexic or similar. Trivial to add.
*Effort: small (1-2 hours).*

**26. High-contrast mode**
CSS variable + toggle.
*Effort: small (half day).*

---

## Suggested Priority Order (Next 8 Weeks)

### Week 1-2: Critical safeguards
1. Safeguarding alert emails (flagged pulse/survey → email DSL)
2. Session timeouts + password complexity + account lockout
3. Audit log for deletions and key admin actions
4. GDPR student export + soft delete

### Week 3-4: Competitive parity
5. Google / Microsoft SSO
6. Wonde MIS integration (start with auth + roster sync)
7. Bulk teacher upload
8. Intervention impact tracking

### Week 5-6: Content + polish
9. Generate audio for junior MeQ Standard
10. Printable individual student report PDF
11. Dyslexia font + high contrast modes
12. Academic year rollover flow
13. Class-to-class comparison view

### Week 7-8: Growth features
14. Welcome/setup wizard for new schools
15. Weekly digest email for SLT
16. White-labelling (logo + colours)
17. CPOMS integration (if API access secured)

### Backlog (beyond 8 weeks)
- Multilingual (Arabic first)
- AI insights
- Student dashboard for return visits
- MTSS interventions
- Longitudinal cohort view
- Parent access
- Public API
- Self-led wellbeing content

---

## Gaps I'd NOT prioritise

Things that sound important but I'd deprioritise:

- **2FA** — for a school admin tool, password reset + session timeout is enough. 2FA adds friction and most teachers will hate it.
- **National benchmarking** — data-blocked, not code-blocked. Wait until you have 50+ schools.
- **Public API** — don't build until a specific customer asks. YAGNI.
- **Self-led student content** — YouHQ has this as their moat. Copying would take years of content work. Better to stay focused as an assessment + analytics tool and let schools pair MeQ with their preferred curriculum.
- **AI insights** — build once there's enough data to make insights meaningful. Premature AI looks cheap.

---

## Top 5 Immediate Wins

If I could only pick 5 things to ship next, in this order:

1. **Safeguarding alert emails** — already have detection, just need dispatch. Highest value per hour of effort.
2. **Google SSO** — biggest UK adoption unlock. Well-trodden path with NextAuth.
3. **Session timeout + basic security hardening** — procurement blocker removal.
4. **Bulk teacher CSV upload** — tiny effort, common request, mirrors existing pattern.
5. **Audio content for junior MeQ Standard** — infrastructure is ready, just needs ElevenLabs generation.

That's roughly 1 week of work combined. Everything else can follow.
