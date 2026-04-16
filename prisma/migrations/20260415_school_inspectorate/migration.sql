-- Inspectorate determines the framing of the inspector summary report
-- (Ofsted UK, KHDA Dubai, ADEK Abu Dhabi, Estyn Wales, or generic).
ALTER TABLE "School" ADD COLUMN "inspectorate" TEXT NOT NULL DEFAULT 'generic';
