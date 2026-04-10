# Atlana — AI Security Agent for IaC

Atlana is a headless AI security agent that scans Infrastructure-as-Code files (Terraform, Dockerfiles) for vulnerabilities and posts fixes directly in Pull Requests via GitHub Actions.

---

## How it works

1. **Trigger** — on every push or PR, the workflow detects changed `.tf` or `Dockerfile` files
2. **Analysis** — files are sent to Google Gemini 2.5 Flash, which identifies security issues and proposes fixes
3. **Feedback** — results are posted as a PR comment and uploaded to GitHub Security (SARIF format)

---

## Setup

1. Copy `.github/workflows/atlana-security.yml` to your repository
2. Add your `GOOGLE_GENERATIVE_AI_API_KEY` to the repository **Secrets** (Settings → Secrets → Actions)
3. Open a PR with a `.tf` or `Dockerfile` change — Atlana runs automatically

---

## Local usage

```bash
npm install
npm run scan -- path/to/your/file.tf
```

---

## Stack

- **AI model**: Google Gemini 2.5 Flash
- **Language**: TypeScript (headless Node.js)
- **Integration**: GitHub Actions + SARIF
- **Guardrails**: Zod schema validation + input sanitization
