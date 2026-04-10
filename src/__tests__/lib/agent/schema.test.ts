import { FixSchema } from '@/lib/agent/schema'

describe('FixSchema', () => {
  it('validates a correct LLM output', () => {
    const input = {
      vulnerabilities: [
        { severity: 'HIGH', description: 'Running as root', line: 1 }
      ],
      fix: 'FROM node:18-alpine\nRUN addgroup -S app && adduser -S app -G app\nUSER app',
      confidenceScore: 0.92,
      reasoning: 'Added non-root user to prevent privilege escalation',
    }
    const result = FixSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects unknown severity values', () => {
    const input = {
      vulnerabilities: [{ severity: 'UNKNOWN', description: 'test' }],
      fix: 'fix',
      confidenceScore: 0.5,
      reasoning: 'reason',
    }
    const result = FixSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects confidenceScore above 1', () => {
    const input = {
      vulnerabilities: [],
      fix: 'fix',
      confidenceScore: 1.5,
      reasoning: 'reason',
    }
    const result = FixSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects fix longer than 5000 chars', () => {
    const input = {
      vulnerabilities: [],
      fix: 'x'.repeat(5001),
      confidenceScore: 0.5,
      reasoning: 'reason',
    }
    const result = FixSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
