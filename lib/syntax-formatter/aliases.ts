export const SYNTAX_FORMATTER_ID = 'formatter'
export const FORMATTER_LANGUAGE_QUERY = 'language'

export const FORMATTER_LANGUAGES = ['html', 'xml', 'css'] as const
export type FormatterLanguage = (typeof FORMATTER_LANGUAGES)[number]
export type FormatterDirection = 'beautify' | 'minify'

export const SYNTAX_FORMATTER_ALIASES = [
  { id: 'htmlformat', language: 'html' },
  { id: 'xmlformatter', language: 'xml' },
  { id: 'csstool', language: 'css' },
] as const

export type SyntaxFormatterAliasId =
  (typeof SYNTAX_FORMATTER_ALIASES)[number]['id']

export function isFormatterLanguage(
  value: string | null | undefined,
): value is FormatterLanguage {
  return value === 'html' || value === 'xml' || value === 'css'
}

export function parseFormatterLanguage(
  value: string | null | undefined,
): FormatterLanguage | null {
  return isFormatterLanguage(value) ? value : null
}

export function getSyntaxFormatterRedirectTo(
  language: FormatterLanguage,
): string {
  return `/${SYNTAX_FORMATTER_ID}.html?${FORMATTER_LANGUAGE_QUERY}=${language}`
}
