import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'
import { sanitizeIaCContent } from '@/lib/guardrails/sanitize'
import { validateLLMOutput } from '@/lib/guardrails/validate'
import type { AnalysisResult } from '@/lib/agent/schema'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

const SYSTEM_PROMPT = `You are a security-focused IaC analyzer. Your sole responsibility is to identify security vulnerabilities in Infrastructure-as-Code files (Dockerfiles, Terraform, etc.) and propose secure, minimal fixes.

Return a JSON object with this exact structure:
{
  "vulnerabilities": [
    { "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", "description": "string", "line": number }
  ],
  "fix": "string (the complete fixed content of the file)",
  "confidenceScore": number (0 to 1),
  "reasoning": "string"
}`

function getMockResult(resourcePath: string): AnalysisResult {
  const isTerraform = resourcePath.endsWith('.tf')

  if (isTerraform) {
    return {
      vulnerabilities: [
        {
          severity: 'CRITICAL',
          description: '[SIMULADO] Security Group exposto: SSH (Porta 22) está aberto para 0.0.0.0/0, permitindo tentativas de força bruta de qualquer lugar.',
          line: 7,
        },
      ],
      fix: `resource "aws_security_group" "allow_ssh" {
  name        = "allow_ssh"
  description = "Allow SSH inbound traffic from trusted IP only"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"] # IP Corporativo
  }
}`,
      confidenceScore: 0.98,
      reasoning: 'Fallback mode (Terraform). Identificamos uma regra de firewall demasiado permissiva que expõe o acesso administrativo da instância.',
    }
  }

  // Fallback para Dockerfile
  return {
    vulnerabilities: [
      {
        severity: 'HIGH',
        description: '[SIMULADO] O contentor está a correr como utilizador "root", o que é um risco de segurança se o contentor for comprometido.',
        line: 1,
      },
    ],
    fix: '# Fixed version (Simulated)\nUSER appuser\nFROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN adduser -D appuser && chown -R appuser /app\nUSER appuser\nCMD ["npm", "start"]',
    confidenceScore: 0.95,
    reasoning: 'Fallback mode (Dockerfile). Identificámos a falta de um utilizador não-privilegiado para a execução do processo principal.',
  }
}

export async function analyzeIaC(
  content: string,
  resourcePath: string
): Promise<{ result: AnalysisResult; promptHash: string }> {
  const sanitized = sanitizeIaCContent(content)
  const prompt = `Analyze the code for security vulnerabilities.
  
File: ${resourcePath}
Content:
${sanitized}`

  const promptHash = crypto.createHash('sha256').update(SYSTEM_PROMPT + prompt).digest('hex')

  // Fallback check: if no key is provided, return mock immediately
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY.includes('your-api-key')) {
    console.warn('Atlana: No valid Gemini API Key found. Using Fallback Mode.')
    return { result: getMockResult(resourcePath), promptHash: 'mock-hash' }
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const rawResult = JSON.parse(text)
    const validatedResult = validateLLMOutput(rawResult)
    
    return { result: validatedResult, promptHash }
  } catch (error) {
    console.error('Atlana: API Error caught. Falling back to Mock Mode.', error)
    return { result: getMockResult(resourcePath), promptHash: 'fallback-mock' }
  }
}
