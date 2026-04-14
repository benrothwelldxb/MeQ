# Student 360 Overview Page — Implementation Plan

## Summary

A rich visual analytics page showing a single student's complete wellbeing picture: framework domain scores across terms (growth), pulse mood trends, teacher assessment comparison, custom survey responses, and overall trajectory. Accessible from both admin and teacher dashboards.

---

## Phase 0: Add Recharts Library

**Why Recharts:** Lightweight, React-native, SSR-friendly, great for line/radar/bar charts. The app currently has no chart library — only custom SVG (Sparkline, ScoreRing). For the 360 page we need radar charts, line charts, and bar charts that would be painful to build from scratch.

**Tasks:**
1. `npm install recharts`
2. Verify it works with Next.js App Router (Recharts components must be in `"use client"` files)

**Verification:** Import renders without errors in dev.

---

## Phase 1: Data Layer — Server Action

**File:** `src/app/actions/student-overview.ts`

Fetch all data for a single student in one action:

```
getStudentOverview(studentId: string) → {
  student: { id, firstName, lastName, displayName, yearGroup, className, tier, sen }
  school: { name, currentTerm, academicYear, pulseEnabled }
  framework: { domains: { key, label, color }[], scoringModel }
  
  assessments: [  // all completed, ordered by term
    { id, term, academicYear, totalScore, overallLevel, reliability,
      domainScores: { [domainKey]: number },
      domainLevels: { [domainKey]: string },
      completedAt }
  ]
  
  teacherAssessments: [  // matching terms
    { id, term, academicYear, teacherName,
      domainScores: { [domainKey]: number },
      domainLevels: { [domainKey]: string },
      completedAt }
  ]
  
  pulseChecks: [  // last 12 weeks
    { weekOf, answers: { [domainKey]: 1-5 }, freeText?, completedAt }
  ]
  
  surveyResponses: [  // all non-anonymous surveys
    { surveyTitle, answers: { [questionId]: answer },
      questions: { id, prompt, questionType, options }[],
      completedAt }
  ]
}
```

**Data sources:**
- `prisma.student.findUnique` with school + yearGroupRef + classGroupRef
- `prisma.assessment.findMany` where studentId, status: "completed", ordered by academicYear asc, term asc
- `prisma.teacherAssessment.findMany` where studentId, status: "completed"
- `prisma.pulseCheck.findMany` where studentId, last 12 weeks, ordered by weekOf asc
- `prisma.surveyResponse.findMany` where studentId (non-null), include survey + survey.questions
- Framework domains from school's assigned framework

**Parse JSON fields:** `domainScoresJson`, `domainLevelsJson`, pulse `answers`, survey `answers`

**Verification:** Call action in a test page, confirm all data returns correctly.

---

## Phase 2: Page Route & Layout

**Route:** `src/app/admin/(authenticated)/students/[id]/page.tsx`
**Also:** `src/app/teacher/(authenticated)/students/[id]/page.tsx` (same component, different auth check)

**Layout structure:**
```
← Back to Students

[Student Name]                    [Year Group] [Class] [SEN badge if applicable]
[School Name] · [Academic Year]

┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW CARDS (4-col grid)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Latest    │ │Overall   │ │Pulse     │ │Surveys   │       │
│  │MeQ Score │ │Level     │ │Avg (week)│ │Completed │       │
│  │  72.5    │ │ Secure   │ │  3.8/5   │ │   3      │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐ ┌──────────────────────────┐
│  DOMAIN RADAR CHART             │ │  OVERALL SCORE TREND     │
│  (Recharts RadarChart)          │ │  (Recharts LineChart)    │
│  Latest self vs teacher overlay │ │  totalScore over terms   │
│  Per-domain scores              │ │  With level bands        │
└─────────────────────────────────┘ └──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DOMAIN GROWTH TABLE                                         │
│  (Reuse existing Progress Over Time pattern)                 │
│  Term 1 → Term 2 → Term 3 with +/- deltas per domain       │
│  Color-coded by domain color from framework                  │
│  Sparklines per domain row                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PULSE MOOD TRENDS                                           │
│  (Recharts LineChart, multi-series)                          │
│  One line per domain, last 12 weeks                          │
│  Y-axis: 1-5, X-axis: week dates                            │
│  Color-coded per domain                                      │
│  Flagged weeks highlighted (any score ≤ 2)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TEACHER vs SELF COMPARISON                                  │
│  (Recharts BarChart, grouped)                                │
│  Side-by-side bars per domain: student self-score vs teacher │
│  For latest completed term                                   │
│  Highlights gaps where teacher sees differently              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CUSTOM SURVEY RESPONSES                                     │
│  Accordion/collapsible per survey                            │
│  Survey title + completion date                              │
│  Question → Answer pairs                                     │
│  Likert answers shown as mini bar                            │
│  Free text shown inline                                      │
│  Flagged responses highlighted in red                        │
└─────────────────────────────────────────────────────────────┘
```

**Styling:** Follow existing admin pattern — `bg-white rounded-xl border border-gray-200 p-6`, section headers `font-bold text-gray-900 mb-4`, grid `gap-4`

**Verification:** Page renders at `/admin/students/[id]` with all sections visible.

---

## Phase 3: Chart Components (all `"use client"`)

### 3a: `DomainRadarChart.tsx`
- Recharts `RadarChart` with `PolarGrid`, `PolarAngleAxis`
- Two datasets: student self-assessment (filled) + teacher assessment (outline)
- Domain labels on axes, colored by domain color
- Props: `selfScores`, `teacherScores`, `domains`, `maxScore`

### 3b: `ScoreTrendChart.tsx`
- Recharts `LineChart` (responsive)
- X-axis: terms (Term 1 2025-2026, Term 2 2025-2026, etc.)
- Y-axis: total score (0 to maxTotalScore)
- Horizontal reference lines at level thresholds (Emerging/Developing/Secure/Advanced bands with light background colors)
- Single line with dots, labeled values

### 3c: `PulseTrendChart.tsx`
- Recharts `LineChart` (responsive), multi-series
- One line per domain, color from framework domain colors
- X-axis: week dates (formatted short: "Mar 10", "Mar 17")
- Y-axis: 1–5 scale
- Tooltip showing all domain values for hovered week
- Reference line at y=2 (flag threshold) in light red

### 3d: `SelfVsTeacherChart.tsx`
- Recharts `BarChart`, grouped
- One group per domain
- Two bars: self (domain color) and teacher (domain color, hatched/lighter)
- Labels below: domain names

### 3e: `SurveyResponseCard.tsx`
- Collapsible card (click to expand)
- Header: survey title + date
- Body: question list with answers
- Likert answers → small horizontal bar (colored by value)
- Free text → blockquote style
- Flagged → red left border

**Verification:** Each component renders with mock data in isolation.

---

## Phase 4: Navigation & Access

1. **Admin students list** (`/admin/students`) — add "View" link per student row → `/admin/students/[id]`
2. **Admin results detail** (`/admin/results/[id]`) — add "Full Profile" link → `/admin/students/[studentId]`
3. **Teacher class page** (`/teacher/class/[classGroupId]`) — add "View" link per student → `/teacher/students/[id]`
4. **Teacher route** — create `src/app/teacher/(authenticated)/students/[id]/page.tsx` that reuses the same overview component but checks teacher session instead of admin session

**Verification:** Links work from all entry points. Teacher can only see students in their classes.

---

## Phase 5: Verification & Polish

1. Test with student who has: completed assessments across multiple terms, pulse history, teacher assessments, survey responses
2. Test with student who has: only 1 term of data (graceful empty states)
3. Test with student who has: no pulse data, no surveys (sections hidden or show "No data yet")
4. Responsive: charts resize on mobile (Recharts `ResponsiveContainer`)
5. Performance: page loads under 2s with reasonable data volume
6. Accessibility: chart labels readable, color not sole differentiator

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `package.json` | Add `recharts` |
| `src/app/actions/student-overview.ts` | NEW — data fetching action |
| `src/app/admin/(authenticated)/students/[id]/page.tsx` | NEW — main 360 page |
| `src/app/teacher/(authenticated)/students/[id]/page.tsx` | NEW — teacher version |
| `src/components/student-overview/DomainRadarChart.tsx` | NEW |
| `src/components/student-overview/ScoreTrendChart.tsx` | NEW |
| `src/components/student-overview/PulseTrendChart.tsx` | NEW |
| `src/components/student-overview/SelfVsTeacherChart.tsx` | NEW |
| `src/components/student-overview/SurveyResponseCard.tsx` | NEW |
| `src/app/admin/(authenticated)/students/page.tsx` | MODIFY — add View link |
| `src/app/admin/(authenticated)/results/[id]/page.tsx` | MODIFY — add Full Profile link |
| `src/app/teacher/(authenticated)/class/[classGroupId]/page.tsx` | MODIFY — add View link |

---

## Estimated Scope

- Phase 0: Small (1 command)
- Phase 1: Medium (1 server action, ~80 lines)
- Phase 2: Large (page layout, ~150 lines)
- Phase 3: Large (5 chart components, ~400 lines total)
- Phase 4: Small (add links to 3 existing pages)
- Phase 5: Testing & polish
