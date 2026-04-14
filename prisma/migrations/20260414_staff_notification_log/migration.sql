-- Track which staff have been successfully notified about a wellbeing
-- check-in for a given term, so admins can resend only to those who
-- haven't received it yet.
CREATE TABLE "StaffWellbeingNotification" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffWellbeingNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffWellbeingNotification_teacherId_term_academicYear_key"
  ON "StaffWellbeingNotification"("teacherId", "term", "academicYear");
CREATE INDEX "StaffWellbeingNotification_term_academicYear_idx"
  ON "StaffWellbeingNotification"("term", "academicYear");
