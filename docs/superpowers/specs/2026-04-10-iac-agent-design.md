# Atlana — IaC Security Remediation Agent
## Design Spec · 2026-04-10

---

## Context

Interview assignment for a DevSecOps position at an AI-first company. The deliverable is a live demo of an AI agent with a visible workflow, guardrails, and security-by-design principles. Timeline: 4 days. The system must be fully understood and explainable by the author under live evaluation.

---

## Problem

Infrastructure-as-Code (IaC) files (Dockerfiles, Terraform) frequently contain security vulnerabilities — hardcoded secrets, overly permissive configurations, missing security controls. Detecting and fixing them manually is slow and inconsistent. An LLM can accelerate remediation, but LLM output must never be trusted blindly in a security context.

---

## Solution

Atlana is a Human-in-the-Loop IaC security remediation agent. An engineer pastes IaC content, the agent analyzes and proposes a structured fix, and no fix exists in the system without explicit human approval. Every decision is logged immutably.

---

## Stack

| Component               | Choice                  | Reason |
|---|---|---|
| Framework               | Next.js 16 (App Router) | UI + API routes in a single process |
| Styling                 | Tailwind CSS + Shadcn UI| Fast production-quality UI |
| Database                | Prisma + SQLite         | Local audit trail, zero infrastructure |
| LLM                     | Claude API (sonnet 4.5) | Structured outputs, reliable for live demo |
| Output Validation       | Zod                     | Strict schema enforcement on LLM output |

**Excluded:** BullMQ + Redis — requires Redis infrastructure, out of scope for 4-day timeline. Workflow state is persisted in SQLite instead, making the state machine visible without a queue.

---

## Workflow (State Machine)

```
[PENDING] → [ANALYZING] → [FIX_GENERATED] → [AWAITING_APPROVAL] → [APPROVED]
                                  ↓                                     ↓
                        [VALIDATION_FAILED]                        [REJECTED]
```

Each state transition creates an audit log record. State never regresses — failures create new records rather than modifying existing ones.

### Steps in Detail

1. **PENDING** — Engineer pastes IaC content in `/scan`, submits form. Record created in DB.
2. **ANALYZING** — `POST /api/scan` sanitizes input, hashes the prompt, calls Claude API.
3. **FIX_GENERATED** — Claude returns structured JSON. Zod validates schema. Status advances.
4. **VALIDATION_FAILED** — Zod schema fails. No unvalidated content reaches the UI. Record closed.
5. **AWAITING_APPROVAL** — Dashboard shows diff view + guardrails panel. Engineer reviews.
6. **APPROVED / REJECTED** — Human decision logged with `reviewedBy` and timestamp. Fix made available (never applied automatically).

---

## Guardrails

### 1. Prompt Isolation (Anti-Injection)

IaC content is always wrapped in XML delimiters before reaching the LLM. Raw string concatenation is never used.

```
<iac_content type="dockerfile">
  {{ sanitized content }}
</iac_content>
```

A SHA-256 hash of the original content is saved to the audit log for forensic traceability. The system can prove what was sent to the LLM.

### 2. Output Schema Validation (Zod)

The LLM output is validated against a strict Zod schema before any data reaches the UI or database. A schema failure sets status to `VALIDATION_FAILED` and no fix is stored.

```typescript
const FixSchema = z.object({
  vulnerabilities: z.array(z.object({
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    description: z.string().max(500),
    line: z.number().optional(),
  })),
  fix: z.string().max(5000),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string().max(1000),
})
```

### 3. Human-in-the-Loop (Mandatory)

No fix achieves `APPROVED` status without an explicit human action. The approval API requires a `reviewedBy` field. The system never applies a fix — it only makes the approved fix available for the engineer to copy and use.

### 4. Least Privilege by Design

The agent has no filesystem access, executes no shell commands, and makes no external calls beyond the Claude API. API routes accept only pasted content — never file paths. The LLM has no ability to affect any system state directly.

---

## Data Models

```prisma
model Vulnerability {
  id           String          @id @default(cuid())
  resourcePath String          // e.g. "Dockerfile", "main.tf" — user-provided label, not a real path
  severity     Severity?       // null until LLM analysis completes
  description  String?         // null until LLM analysis completes
  content      String          // original IaC content
  status       Status          @default(PENDING)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  auditLogs    AgentAuditLog[]
}

model AgentAuditLog {
  id                       String        @id @default(cuid())
  vulnerabilityId          String
  vulnerability            Vulnerability @relation(fields: [vulnerabilityId], references: [id])
  promptHash               String        // SHA-256 of the full prompt sent to LLM
  generatedFix             String?
  confidenceScore          Float?
  securityValidationPassed Boolean       @default(false)
  humanDecision            Decision      @default(PENDING)
  reviewedBy               String?
  timestamp                DateTime      @default(now())
}

enum Severity { CRITICAL HIGH MEDIUM LOW }
enum Status   { PENDING ANALYZING FIX_GENERATED VALIDATION_FAILED AWAITING_APPROVAL APPROVED REJECTED }
enum Decision { PENDING APPROVED REJECTED }
```

---

## Directory Structure

```
atlana/
  src/
    app/
      page.tsx                         # HITL Dashboard — list of pending fixes
      scan/
        page.tsx                       # New scan form
      api/
        scan/
          route.ts                     # POST: create + trigger analysis
        vulnerabilities/
          [id]/
            approve/
              route.ts                 # POST: human approval
            reject/
              route.ts                 # POST: human rejection
    lib/
      agent/
        analyzer.ts                    # Claude integration + prompt isolation
        schema.ts                      # Zod schemas for LLM output
      guardrails/
        sanitize.ts                    # Input sanitization
        validate.ts                    # Output validation
      prisma.ts                        # Prisma client singleton
    components/
      VulnerabilityCard.tsx            # Card for each vulnerability in dashboard
      DiffViewer.tsx                   # Side-by-side original vs fix
      StatusBadge.tsx                  # Visual status indicator
      GuardrailsPanel.tsx              # Demo-critical: shows hash, validation, confidence
  prisma/
    schema.prisma
  ARCHITECTURE.md
  .env.local                           # ANTHROPIC_API_KEY (never committed)
```

---

## Pages

### `/` — HITL Dashboard
Lists all vulnerabilities grouped by status. `AWAITING_APPROVAL` items are shown first. Each card shows severity badge, resource path, confidence score, and Approve/Reject actions. The `GuardrailsPanel` is always visible, showing prompt hash and validation result.

### `/scan` — New Scan
A textarea for pasting IaC content, a field for resource path (e.g. `Dockerfile`), and a submit button. On submit, calls `POST /api/scan` and redirects to the dashboard.

---

## API Routes

| Method | Path | Action |
|---|---|---|
| POST | `/api/scan` | Sanitize input → call Claude → validate output → persist |
| POST | `/api/vulnerabilities/[id]/approve` | Set `humanDecision=APPROVED`, log `reviewedBy` |
| POST | `/api/vulnerabilities/[id]/reject` | Set `humanDecision=REJECTED`, log `reviewedBy` |

---

## Demo Script (60 seconds)

1. Open `/scan`, paste a Dockerfile with known vulnerabilities (running as root, no HEALTHCHECK, `latest` tag)
2. Submit — watch status change to `ANALYZING` then `AWAITING_APPROVAL`
3. Dashboard shows diff view. `GuardrailsPanel` shows: prompt hash, `validationPassed: true`, `confidenceScore: 0.91`
4. Click **Approve** — status becomes `APPROVED`, audit log records decision
5. Explain: "The system never applied anything. It proposed, validated, and waited. The engineer is always in control."

---

## What This Demonstrates to the Evaluator

- Understanding of AI guardrails (not just calling an API)
- Security-by-design: HITL, least privilege, prompt isolation, schema validation
- Audit trail and forensic traceability
- Clean separation between AI suggestion and human decision
- Practical DevSecOps judgment: scoped to what works reliably in a live demo
