CREATE TABLE "FailedLoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FailedLoginAttempt_email_userType_attemptedAt_idx" ON "FailedLoginAttempt"("email", "userType", "attemptedAt");
