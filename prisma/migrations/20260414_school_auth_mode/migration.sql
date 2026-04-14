-- Add authMode column to School: "password" | "sso" | "both"
ALTER TABLE "School" ADD COLUMN "authMode" TEXT NOT NULL DEFAULT 'both';
