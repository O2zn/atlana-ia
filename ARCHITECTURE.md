# Atlana — Architecture and Security Documentation

## Objective

Atlana is a Human-in-the-Loop IaC Security Remediation Agent. It analyzes Dockerfiles and Terraform files for security vulnerabilities using Claude AI, generates structured fix proposals, and enforces mandatory human approval before any remediation is surfaced. Every decision is logged immutably for audit.

## Agent Workflow (State Machine)

```
[PENDING] → [ANALYZING] → [AWAITING_APPROVAL] → [APPROVED]
                  ↓                                   ↓
          [VALIDATION_FAILED]                    [REJECTED]
```

### State Transitions

| From | To | Trigger |
|---|---|---|
| PENDING | ANALYZING | API route begins Claude call |
| ANALYZING | AWAITING_APPROVAL | Claude responds, Zod validates output |
| ANALYZING | VALIDATION_FAILED | Zod schema fails or Claude call errors |
| AWAITING_APPROVAL | APPROVED | Engineer clicks Approve |
| AWAITING_APPROVAL | REJECTED | Engineer clicks Reject |

State is persisted in SQLite (Prisma). State never regresses — failures create a new audit log record.

## Guardrails

### 1. Prompt Isolation (Anti-Injection)

User-supplied IaC content is sanitized before being wrapped in XML delimiters:

```
<iac_content type="Dockerfile">
  {{ sanitized content }}
</iac_content>
```

Sanitization escapes `<` → `&lt;` and `>` → `&gt;` to prevent prompt injection via malicious IaC content (e.g., `# IGNORE PREVIOUS INSTRUCTIONS`). A SHA-256 hash of the full prompt is stored in `AgentAuditLog.promptHash` for forensic traceability.

### 2. Output Schema Validation (Zod)

Claude is forced to respond via `tool_use` with a named tool (`report_vulnerabilities`) and a strict JSON schema. The tool input is then validated again by a Zod schema before any data reaches the database or UI. If validation fails, status is set to `VALIDATION_FAILED` and no fix is stored.

### 3. Human-in-the-Loop (Mandatory)

No fix achieves `APPROVED` status without an explicit POST to `/api/vulnerabilities/[id]/approve` with a `reviewedBy` field. The system never applies fixes — it only makes approved fixes available for the engineer to copy.

### 4. Principle of Least Privilege

- The agent reads no files from the filesystem — only content pasted by the engineer
- The agent executes no shell commands
- The agent makes no external calls beyond the Anthropic API
- API keys are stored in `.env.local` and never committed

## Data Models

- **Vulnerability**: tracks the IaC content, analysis status, and top vulnerability found
- **AgentAuditLog**: immutable record of every LLM call and human decision, including prompt hash, confidence score, and reviewer identity

## Tech Stack

| Component | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + Shadcn UI |
| Database | Prisma + SQLite |
| LLM | Claude API (claude-sonnet-4-5) |
| Output Validation | Zod |
