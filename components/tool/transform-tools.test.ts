import { describe, expect, it } from 'vitest'
import { transformToml } from './toml'

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
