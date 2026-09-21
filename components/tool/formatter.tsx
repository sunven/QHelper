import {
  ArrowLeftRight,
  Download,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CopyButton } from '@/components/tool/CopyButton'
import { ToolHistoryList } from '@/components/tool/ToolHistoryList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePersistedValue } from '@/hooks/usePersistedValue'
import { useToolHistory } from '@/hooks/useToolHistory'
import { getToolStateStorageKey } from '@/lib/chrome/local-persisted-data'
import {
  DEFAULT_HTML_OPTIONS,
  FORMATTER_HISTORY_KEY,
  FORMATTER_HISTORY_MAX,
  FORMATTER_LANGUAGE_META,
  FORMATTER_LANGUAGE_QUERY,
  FORMATTER_LANGUAGES,
  type FormatterDirection,
  type FormatterHistorySnapshot,
  type FormatterLanguage,
  type HtmlFormatterOptions,
  migrateLegacyFormatterHistory,
  parseFormatterLanguage,
  SYNTAX_FORMATTER_ID,
  transformFormatterInput,
} from '@/lib/syntax-formatter'

const languageStorageKey = getToolStateStorageKey(
  SYNTAX_FORMATTER_ID,
  FORMATTER_LANGUAGE_QUERY,
)

function directionOutputLabel(mode: FormatterDirection): string {
  return mode === 'beautify' ? '美化结果' : '压缩结果'
}

export function SyntaxFormatter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryLanguage = parseFormatterLanguage(
    searchParams.get(FORMATTER_LANGUAGE_QUERY),
  )
  const {
    value: storedLanguage,
    setValue: setStoredLanguage,
    loading: languageLoading,
  } = usePersistedValue<FormatterLanguage>(languageStorageKey, 'html')

  const language = queryLanguage ?? storedLanguage
  const languageReady = queryLanguage !== null || !languageLoading

  const [input, setInput] = useState('')
  const [sampleApplied, setSampleApplied] = useState(false)
  const [mode, setMode] = useState<FormatterDirection>('beautify')
  const [htmlOptions, setHtmlOptions] =
    useState<HtmlFormatterOptions>(DEFAULT_HTML_OPTIONS)

  const { add, history } = useToolHistory<FormatterHistorySnapshot>(
    SYNTAX_FORMATTER_ID,
    {
      max: FORMATTER_HISTORY_MAX,
      key: FORMATTER_HISTORY_KEY,
    },
  )

  useEffect(() => {
    void migrateLegacyFormatterHistory()
  }, [])

  useEffect(() => {
    if (!languageReady || sampleApplied) {
      return
    }
    setInput(FORMATTER_LANGUAGE_META[language].defaultInput)
    setSampleApplied(true)
  }, [language, languageReady, sampleApplied])

  useEffect(() => {
    if (!languageReady) {
      return
    }
    if (queryLanguage !== language) {
      setSearchParams(
        { [FORMATTER_LANGUAGE_QUERY]: language },
        { replace: true },
      )
    }
    if (storedLanguage !== language) {
      void setStoredLanguage(language)
    }
  }, [
    language,
    languageReady,
    queryLanguage,
    setSearchParams,
    setStoredLanguage,
    storedLanguage,
  ])

  const languageMeta = FORMATTER_LANGUAGE_META[language]
  const result = useMemo(() => {
    if (!input.trim()) {
      return ''
    }
    return transformFormatterInput(input, language, mode, htmlOptions)
  }, [htmlOptions, input, language, mode])

  const output = typeof result === 'string' ? result : ''
  const error = result instanceof Error ? result.message : null

  const handleLanguageChange = useCallback(
    (next: FormatterLanguage) => {
      setSearchParams({ [FORMATTER_LANGUAGE_QUERY]: next }, { replace: true })
      void setStoredLanguage(next)
    },
    [setSearchParams, setStoredLanguage],
  )

  const handleSwap = useCallback(() => {
    setMode((current) => (current === 'beautify' ? 'minify' : 'beautify'))
    setInput(output)
  }, [output])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  const handleDownload = useCallback(() => {
    if (!output || error) {
      return
    }
    const blob = new Blob([output], { type: languageMeta.download.mimeType })
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = `${languageMeta.download.prefix}-${Date.now()}.${languageMeta.download.extension}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
    add({
      input,
      language,
      mode,
      htmlOptions,
    })
  }, [add, error, htmlOptions, input, language, languageMeta, mode, output])

  return (
    <div className="mx-auto max-w-[1520px] space-y-2">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-2">
          <div className="flex items-center gap-1.5">
            {FORMATTER_LANGUAGES.map((candidate) => (
              <Button
                key={candidate}
                type="button"
                data-testid={`formatter-language-${candidate}`}
                onClick={() => handleLanguageChange(candidate)}
                variant={language === candidate ? 'default' : 'outline'}
                size="sm"
              >
                {FORMATTER_LANGUAGE_META[candidate].label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              onClick={() => setMode('beautify')}
              variant={mode === 'beautify' ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
            >
              <Maximize2 className="w-4 h-4" />
              美化
            </Button>
            <Button
              type="button"
              onClick={() => setMode('minify')}
              variant={mode === 'minify' ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
            >
              <Minimize2 className="w-4 h-4" />
              压缩
            </Button>
            <Button
              type="button"
              onClick={handleSwap}
              variant="outline"
              size="sm"
              className="px-2"
              title="交换方向"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>
          {language === 'html' && (
            <div className="flex items-center gap-2">
              <Select
                value={String(htmlOptions.indentSize)}
                onValueChange={(value) =>
                  setHtmlOptions((current) => ({
                    ...current,
                    indentSize: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 空格</SelectItem>
                  <SelectItem value="4">4 空格</SelectItem>
                  <SelectItem value="8">8 空格</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={htmlOptions.indentChar}
                onValueChange={(value) =>
                  setHtmlOptions((current) => ({
                    ...current,
                    indentChar: value as 'space' | 'tab',
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">空格缩进</SelectItem>
                  <SelectItem value="tab">Tab 缩进</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {error && (
            <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400">
              <Zap className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-2 lg:grid-cols-2">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 py-2">
            <CardTitle className="text-sm">{languageMeta.inputLabel}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs"
            >
              清空
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 p-0">
            <Textarea
              data-testid="formatter-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`输入${languageMeta.inputLabel}...`}
              className="h-full min-h-[360px] w-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 lg:min-h-0"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 py-2">
            <CardTitle className="text-sm">
              {directionOutputLabel(mode)}
            </CardTitle>
            <div className="flex gap-1.5">
              <CopyButton
                content={error ? '' : output}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!output || !!error}
                className="h-7 gap-1 px-2 text-xs"
              >
                <Download className="w-3 h-3" />
                下载
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 p-0">
            <Textarea
              data-testid="formatter-output"
              value={error ?? output}
              readOnly
              className={`h-full min-h-[360px] w-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 lg:min-h-0 ${
                error
                  ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
                  : 'bg-muted/50'
              }`}
            />
          </CardContent>
        </Card>
      </div>

      {!error && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>输入字符: {input.length}</span>
          <span>输出字符: {output.length}</span>
          {input.length > 0 && (
            <span>
              压缩率: {Math.round((1 - output.length / input.length) * 100)}%
            </span>
          )}
        </div>
      )}

      <ToolHistoryList
        entries={history}
        onSelect={(entry) => {
          setInput(entry.input.input)
          setMode(entry.input.mode)
          setHtmlOptions(entry.input.htmlOptions)
          setSampleApplied(true)
          handleLanguageChange(entry.input.language)
        }}
        renderItem={(entry) => (
          <div className="line-clamp-1 font-mono text-xs text-muted-foreground">
            {FORMATTER_LANGUAGE_META[entry.input.language].label}:{' '}
            {entry.input.input.slice(0, 100)}...
          </div>
        )}
      />
    </div>
  )
}
