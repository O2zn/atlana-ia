import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'
import { sanitizeIaCContent } from '@/lib/guardrails/sanitize'
import { validateLLMOutput } from '@/lib/guardrails/validate'
import type { AnalysisResult } from '@/lib/agent/schema'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `You are a security-focused IaC analyzer. Your sole responsibility is to identify security vulnerabilities in Infrastructure-as-Code files (Dockerfiles, Terraform, etc.) and propose secure, minimal fixes.

Rules:
- Only report actual security issues, not style preferences
- Be conservative: when in doubt, flag it
- The fix must be a complete, working replacement of the original file
- Assign confidenceScore based on how certain you are about the vulnerabilities found`

const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_vulnerabilities',
  description: 'Report security vulnerabilities found in IaC and propose a complete fixed version',
  input_schema: {
    type: 'object',
    properties: {
      vulnerabilities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            description: { type: 'string' },
            line: { type: 'number' },
          },
          required: ['severity', 'description'],
        },
      },
      fix: { type: 'string' },
      confidenceScore: { type: 'number' },
      reasoning: { type: 'string' },
    },
    required: ['vulnerabilities', 'fix', 'confidenceScore', 'reasoning'],
  },
}

function buildPrompt(sanitizedContent: string, resourcePath: string): string {
  return `Analyze the following IaC file for security vulnerabilities and propose a complete fixed version:

<iac_content type="${resourcePath}">
${sanitizedContent}
</iac_content>`
}

export async function analyzeIaC(
  content: string,
  resourcePath: string
): Promise<{ result: AnalysisResult; promptHash: string }> {
  const sanitized = sanitizeIaCContent(content)
  const prompt = buildPrompt(sanitized, resourcePath)
  const promptHash = crypto.createHash('sha256').update(SYSTEM_PROMPT + prompt).digest('hex')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    tools: [REPORT_TOOL],
    tool_choice: { type: 'tool', name: 'report_vulnerabilities' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUseBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolUseBlock) {
    throw new Error('Claude did not invoke the expected tool')
  }

  const result = validateLLMOutput(toolUseBlock.input)
  return { result, promptHash }
}
