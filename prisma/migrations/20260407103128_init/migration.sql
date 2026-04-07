-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loginCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "yearGroup" TEXT NOT NULL,
    "className" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "questionFormat" TEXT NOT NULL,
    "answerOptions" TEXT NOT NULL,
    "scoreMap" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "isValidation" BOOLEAN NOT NULL DEFAULT false,
    "isTrap" BOOLEAN NOT NULL DEFAULT false,
    "validationPair" INTEGER
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "totalScore" REAL,
    "overallLevel" TEXT,
    "knowMeScore" REAL,
    "manageMeScore" REAL,
    "understandOthersScore" REAL,
    "workWithOthersScore" REAL,
    "chooseWellScore" REAL,
    "knowMeLevel" TEXT,
    "manageMeLevel" TEXT,
    "understandOthersLevel" TEXT,
    "workWithOthersLevel" TEXT,
    "chooseWellLevel" TEXT,
    "reliabilityScore" TEXT,
    "rawResponseJson" TEXT,
    "lastQuestionNum" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Assessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_loginCode_key" ON "Student"("loginCode");

-- CreateIndex
CREATE UNIQUE INDEX "Question_orderIndex_key" ON "Question"("orderIndex");
