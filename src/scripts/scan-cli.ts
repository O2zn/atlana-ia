import fs from 'fs'
import path from 'path'
import { analyzeIaC } from '../lib/agent/analyzer'
import type { AnalysisResult } from '../lib/agent/schema'

/**
 * Minimal SARIF generation for GitHub Code Scanning
 */
function generateSARIF(results: Array<{ file: string; analysis: AnalysisResult }>) {
  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Atlana',
            version: '1.0.0',
            informationUri: 'https://github.com/oazen/atlana',
            rules: [
              {
                id: 'ATL001',
                name: 'IaCSecurityVulnerability',
                shortDescription: { text: 'Security vulnerability found in IaC file' },
                helpUri: 'https://github.com/oazen/atlana/blob/main/docs/rules.md',
              },
            ],
          },
        },
        results: results.flatMap(r =>
          r.analysis.vulnerabilities.map(v => ({
            ruleId: 'ATL001',
            level: v.severity === 'CRITICAL' || v.severity === 'HIGH' ? 'error' : 'warning',
            message: { text: v.description },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: r.file },
                  region: { startLine: v.line || 1 },
                },
              },
            ],
          }))
        ),
      },
    ],
  }
  return JSON.stringify(sarif, null, 2)
}

/**
 * Human readable summary for PR Comments
 */
function generatePRComment(results: Array<{ file: string; analysis: AnalysisResult }>) {
  let comment = '## 🛡️ Atlana Security Report\n\n'
  
  if (results.length === 0) {
    comment += '✅ No vulnerabilities found in changed IaC files.'
    return comment
  }

  results.forEach(r => {
    comment += `### 📄 \`${r.file}\`\n`
    r.analysis.vulnerabilities.forEach(v => {
      const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'HIGH' ? '🟠' : '🟡'
      comment += `- ${icon} **${v.severity}**: ${v.description} (Line: ${v.line || 'Unknown'})\n`
    })
    comment += '\n#### 🛠️ Proposed Fix:\n'
    comment += '```' + (r.file.endsWith('.tf') ? 'hcl' : 'dockerfile') + '\n'
    comment += r.analysis.fix
    comment += '\n```\n\n'
  })

  comment += '> [!TIP]\n'
  comment += '> Apply these fixes to secure your infrastructure. Analyze more files at the [Atlana Dashboard](http://localhost:3000).'
  
  return comment
}

async function main() {
  const args = process.argv.slice(2)
  const files = args.filter(f => f.endsWith('.tf') || f.toLowerCase().includes('dockerfile'))

  if (files.length === 0) {
    console.log('No IaC files to scan.')
    process.exit(0)
  }

  console.log(`🚀 Atlana: Scanning ${files.length} files...`)
  const scanResults = []

  for (const file of files) {
    const absolutePath = path.resolve(process.cwd(), file)
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ File not found: ${file}`)
      continue
    }

    const content = fs.readFileSync(absolutePath, 'utf-8')
    try {
      const { result } = await analyzeIaC(content, file)
      scanResults.push({ file, analysis: result })
      console.log(`✅ Scanned: ${file} (${result.vulnerabilities.length} issues found)`)
    } catch (error) {
      console.error(`❌ Error scanning ${file}:`, error)
    }
  }

  // Output SARIF
  const sarifData = generateSARIF(scanResults)
  fs.writeFileSync('atlana-results.sarif', sarifData)
  console.log('📝 SARIF report saved to atlana-results.sarif')

  // Output PR Comment (to a file for GH Action to read)
  const prComment = generatePRComment(scanResults)
  fs.writeFileSync('atlana-pr-comment.md', prComment)
  console.log('💬 PR Comment summary saved to atlana-pr-comment.md')
}

main().catch(err => {
  console.error('Fatal error during scan:', err)
  process.exit(1)
})
