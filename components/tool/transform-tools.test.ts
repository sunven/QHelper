import { describe, expect, it } from 'vitest'
import { transformToml } from './toml'
import { transformXml } from './xmlformatter'
import { transformHtml } from './htmlformat'
import { transformCss } from './csstool'

describe('transformToml', () => {
  it('converts TOML to JSON', () => {
    const result = transformToml('title = "hello"', { mode: 'toml-to-json' })
    expect(result).toBe(JSON.stringify({ title: 'hello' }, null, 2))
  })

  it('converts JSON to TOML', () => {
    const result = transformToml('{"title":"hello"}', { mode: 'json-to-toml' })
    expect(result).toBe('title = "hello"\n')
  })

  it('returns an Error for invalid TOML', () => {
    const result = transformToml('title =', { mode: 'toml-to-json' })
    expect(result).toBeInstanceOf(Error)
  })

  it('returns an Error for invalid JSON', () => {
    const result = transformToml('{nope', { mode: 'json-to-toml' })
    expect(result).toBeInstanceOf(Error)
  })
})

describe('transformXml', () => {
  it('beautifies XML', () => {
    const result = transformXml('<root><a>1</a></root>', { mode: 'beautify' })
    expect(result).toBe('<root>\n  <a>1</a>\n</root>\n')
  })

  it('minifies XML', () => {
    const result = transformXml(
      '<root>\n  <a>1</a>\n</root>',
      { mode: 'minify' },
    )
    expect(result).toBe('<root><a>1</a></root>')
  })

  it('returns an Error for invalid XML', () => {
    const result = transformXml('<root', { mode: 'beautify' })
    expect(result).toBeInstanceOf(Error)
  })
})

describe('transformHtml', () => {
  it('beautifies HTML', () => {
    const result = transformHtml('<div><p>hi</p></div>', {
      mode: 'beautify',
      indentSize: 2,
      indentChar: 'space',
      wrapLineLength: 120,
    })
    expect(result).toBe('<div>\n  <p>hi</p>\n</div>')
  })

  it('minifies HTML', () => {
    const result = transformHtml('<div>\n  <p>hi</p>\n</div>', {
      mode: 'minify',
      indentSize: 2,
      indentChar: 'space',
      wrapLineLength: 120,
    })
    expect(result).toBe('<div><p>hi</p></div>')
  })
})

describe('transformCss', () => {
  it('minifies CSS', () => {
    const result = transformCss('.a {\n  color: red;\n}', { mode: 'minify' })
    expect(result).toBe('.a{color:red}')
  })

  it('beautifies CSS', () => {
    const result = transformCss('.a{color:red}', { mode: 'beautify' })
    // csso 压缩器会去掉分号；美化结果保留嵌套块的换行缩进形态
    expect(result).toContain('.a {')
    expect(result).toContain('\n}')
  })

  it('normalizes invalid CSS instead of throwing (csso is forgiving)', () => {
    // csso 对残缺输入不抛错而是清空输出；错误通道留给真正的解析异常
    const result = transformCss('.a { color: red', { mode: 'minify' })
    expect(typeof result).toBe('string')
  })
})
