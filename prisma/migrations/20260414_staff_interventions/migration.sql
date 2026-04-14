-- Staff interventions: parallel to student Intervention table,
-- but linked by domainKey to StaffDomain (system-wide, not per-Framework)
CREATE TABLE "StaffIntervention" (
    "id" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffIntervention_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffIntervention_domainKey_level_idx" ON "StaffIntervention"("domainKey", "level");
