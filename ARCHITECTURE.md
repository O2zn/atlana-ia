# Atlana — Technical Architecture

## Overview
Atlana is a Human-in-the-Loop (HITL) security remediation agent for Infrastructure-as-Code (IaC). It uses a "Defense-in-Depth" approach for LLM interactions.

## Core Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Prisma ORM
- **Security Agent**: Google Gemini 1.5 Flash
- **Styling**: Tailwind CSS + Shadcn UI (Glassmorphism design)

## Security Guardrails
1. **Input Sanitization**: All IaC input is wrapped in XML-style tags and escaped before being sent to the LLM to prevent prompt injection.
2. **Output Validation**: LLM responses are strictly validated against a Zod schema. If validation fails, the system triggers a retry or falls back to a safe state.
3. **Forensic Traceability**: Every LLM call generates a `promptHash` and is logged in the `AgentAuditLog` table.

## The Resiliency Layer (Atlana Lite)
The `analyzer.ts` module implements a robust fallback mechanism:
- **Try Phase**: Attempts a real analysis using the Gemini API.
- **Catch Phase**: If the API call fails (connectivity, quota, invalid key), the system automatically generates a **MOCK** analysis result.
- **Benefit**: Ensures the UI and the HITL logic remain functional for demonstration and development purposes at all times.

## Data Models (Prisma)
### Vulnerability
Tracks the lifecycle of a security finding:
- `PENDING` -> `ANALYZING` -> `AWAITING_APPROVAL` -> `APPROVED/REJECTED`.

### AgentAuditLog
Immutable logs of the agent's decisions:
- Stores generated fixes, confidence scores, and human decision metadata.

## Workflow
1. User submits IaC content.
2. Agent analyzes (Real or Mock).
3. Findings appear on the Dashboard.
4. Human reviews the Diff and provides a Decision (Approve/Reject).
5. Audit log is updated with the reviewer's name.
