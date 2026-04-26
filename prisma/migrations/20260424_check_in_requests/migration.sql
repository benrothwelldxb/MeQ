-- Student-initiated check-in requests (asking to speak with a staff member).
-- Defaults to the student's class teacher but they can pick another staff member.
-- Appears on the Safeguarding page (Check-ins tab) and on the target teacher's dashboard.

CREATE TABLE "CheckInRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "targetTeacherId" TEXT,
  "freeText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByType" TEXT,
  "resolvedById" TEXT,
  CONSTRAINT "CheckInRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CheckInRequest_targetTeacherId_fkey" FOREIGN KEY ("targetTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CheckInRequest_status_check" CHECK ("status" IN ('open', 'resolved'))
);

CREATE INDEX "CheckInRequest_schoolId_status_createdAt_idx"
  ON "CheckInRequest"("schoolId", "status", "createdAt");

CREATE INDEX "CheckInRequest_targetTeacherId_status_idx"
  ON "CheckInRequest"("targetTeacherId", "status");

-- Pulse questions: add audio for read-aloud (junior tier).
ALTER TABLE "PulseQuestion" ADD COLUMN "audioUrl" TEXT;
