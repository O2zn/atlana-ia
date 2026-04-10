-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourcePath" TEXT NOT NULL,
    "severity" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vulnerabilityId" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "generatedFix" TEXT,
    "confidenceScore" REAL,
    "securityValidationPassed" BOOLEAN NOT NULL DEFAULT false,
    "humanDecision" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentAuditLog_vulnerabilityId_fkey" FOREIGN KEY ("vulnerabilityId") REFERENCES "Vulnerability" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
