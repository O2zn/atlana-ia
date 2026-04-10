import { FixSchema, type AnalysisResult } from '@/lib/agent/schema'

export function validateLLMOutput(raw: unknown): AnalysisResult {
  const result = FixSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(
      `LLM output failed schema validation: ${result.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join(', ')}`
    )
  }
  return result.data
}
