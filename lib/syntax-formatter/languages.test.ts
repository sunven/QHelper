import { describe, expect, it } from 'vitest'
import {
  getSyntaxFormatterRedirectTo,
  parseFormatterLanguage,
  SYNTAX_FORMATTER_ALIASES,
} from './aliases'
import { transformFormatterInput } from './languages'

describe('parseFormatterLanguage', () => {
  it('accepts html, xml, and css', () => {
    expect(parseFormatterLanguage('html')).toBe('html')
    expect(parseFormatterLanguage('xml')).toBe('xml')
    expect(parseFormatterLanguage('css')).toBe('css')
  })

  it('rejects unknown values', () => {
    expect(parseFormatterLanguage('json')).toBeNull()
    expect(parseFormatterLanguage('')).toBeNull()
    expect(parseFormatterLanguage(null)).toBeNull()
  })
})

describe('getSyntaxFormatterRedirectTo', () => {
  it('sends aliases to the canonical path with a language query', () => {
    expect(getSyntaxFormatterRedirectTo('html')).toBe(
      '/formatter.html?language=html',
    )
    expect(SYNTAX_FORMATTER_ALIASES.map((alias) => alias.id)).toEqual([
      'htmlformat',
      'xmlformatter',
      'csstool',
    ])
  })
})

describe('transformFormatterInput', () => {
  it('beautifies HTML', () => {
    const result = transformFormatterInput(
      '<div><p>hi</p></div>',
      'html',
      'beautify',
    )
    expect(result).toBe('<div>\n  <p>hi</p>\n</div>')
  })

  it('minifies XML', () => {
    const result = transformFormatterInput(
      '<root>\n  <a>1</a>\n</root>',
      'xml',
      'minify',
    )
    expect(result).toBe('<root><a>1</a></root>')
  })

  it('minifies CSS', () => {
    const result = transformFormatterInput(
      '.a {\n  color: red;\n}',
      'css',
      'minify',
    )
    expect(result).toBe('.a{color:red}')
  })
})
