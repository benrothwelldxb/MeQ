-- Log of nudge emails sent to incomplete staff. Doesn't record which
-- individuals were nudged (privacy) — just the school, term, and count.
CREATE TABLE "StaffWellbeingNudge" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientCount" INTEGER NOT NULL,
    CONSTRAINT "StaffWellbeingNudge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffWellbeingNudge_schoolId_term_academicYear_sentAt_idx"
  ON "StaffWellbeingNudge"("schoolId", "term", "academicYear", "sentAt");
