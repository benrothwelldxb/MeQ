-- In-app notifications (bell icon). One row per user who should see the notice.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userType_userId_readAt_idx"
  ON "Notification"("userType", "userId", "readAt");
CREATE INDEX "Notification_userType_userId_createdAt_idx"
  ON "Notification"("userType", "userId", "createdAt");
