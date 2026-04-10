import { z } from 'zod'

export const VulnerabilityItemSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().max(500),
  line: z.number().optional(),
})

export const FixSchema = z.object({
  vulnerabilities: z.array(VulnerabilityItemSchema),
  fix: z.string().max(5000),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string().max(1000),
})

export type AnalysisResult = z.infer<typeof FixSchema>
export type VulnerabilityItem = z.infer<typeof VulnerabilityItemSchema>
