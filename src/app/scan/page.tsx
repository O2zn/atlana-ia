'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const EXAMPLE_DOCKERFILE = `FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl wget
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]`

export default function ScanPage() {
  const router = useRouter()
  const [content, setContent] = useState(EXAMPLE_DOCKERFILE)
  const [resourcePath, setResourcePath] = useState('Dockerfile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, resourcePath }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? 'Scan failed')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>New Security Scan</CardTitle>
          <p className="text-sm text-slate-500">
            Paste your Dockerfile or Terraform content. The agent will analyze it and propose a fix.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="resourcePath">Resource label</Label>
              <input
                id="resourcePath"
                type="text"
                value={resourcePath}
                onChange={e => setResourcePath(e.target.value)}
                placeholder="e.g. Dockerfile, main.tf"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="content">IaC Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={16}
                className="font-mono text-sm"
                placeholder="Paste your Dockerfile or Terraform here..."
                required
              />
            </div>

            {error && (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Analyzing with Claude…' : 'Analyze for Vulnerabilities'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
