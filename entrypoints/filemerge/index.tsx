import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { buildDownloadFileName, mergeRemoteText, parseMergeInput } from '@/lib/filemerge/merge'
import { Download, FileCode } from 'lucide-react'
import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../../index.css'

function downloadByData(data: string) {
  const url = window.URL.createObjectURL(
    new Blob([data], {
      type: 'application/javascript; charset=utf-8',
    }),
  )
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.setAttribute('download', buildDownloadFileName())
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

function FileMergeTool() {
  const [source, setSource] = useState('')

  async function handleDownload() {
    if (!source) {
      return
    }

    const urls = parseMergeInput(source)
    if (urls.length < 1) {
      return
    }

    const data = await mergeRemoteText(urls)
    downloadByData(data)
  }

  return (
    <ToolPageShell toolId="filemerge">
      <div className="mx-auto max-w-[1280px]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode className="h-4 w-4" />
              脚本列表
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={'<script src="xxx.js"></script> 或 xxx.js  多个换行'}
              className="h-[min(68vh,680px)] font-mono text-sm"
            />
            <Button type="button" onClick={() => void handleDownload()} size="sm">
              <Download className="h-4 w-4" />
              download
            </Button>
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="filemerge" toolName="JS 文件合并">
      <FileMergeTool />
    </ToolErrorBoundary>,
  )
}
