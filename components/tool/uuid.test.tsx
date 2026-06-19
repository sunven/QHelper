import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateUUID } from './uuid'

const originalCrypto = globalThis.crypto

function setCryptoMock(cryptoMock: Partial<Crypto>) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: cryptoMock,
  })
}

describe('uuid/generateUUID', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    })
  })

  it('uses crypto.randomUUID instead of Math.random', () => {
    const randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000')
    const mathRandom = vi.spyOn(Math, 'random')
    setCryptoMock({ randomUUID } as Partial<Crypto>)

    expect(generateUUID()).toBe('123e4567-e89b-42d3-a456-426614174000')
    expect(randomUUID).toHaveBeenCalledTimes(1)
    expect(mathRandom).not.toHaveBeenCalled()
  })

  it('applies uppercase and no-hyphen formatting', () => {
    setCryptoMock({
      randomUUID: vi.fn(() => '123e4567-e89b-42d3-a456-426614174000'),
    } as Partial<Crypto>)

    expect(generateUUID({ uppercase: true, withoutHyphens: true })).toBe(
      '123E4567E89B42D3A456426614174000',
    )
  })

  it('falls back to crypto.getRandomValues when randomUUID is unavailable', () => {
    setCryptoMock({
      getRandomValues: vi.fn((array: Uint8Array) => {
        array.set([
          0x12, 0x3e, 0x45, 0x67, 0xe8, 0x9b, 0x02, 0xd3,
          0x24, 0x56, 0x42, 0x66, 0x14, 0x17, 0x40, 0x00,
        ])
        return array
      }),
    } as Partial<Crypto>)

    expect(generateUUID()).toBe('123e4567-e89b-42d3-a456-426614174000')
  })
})
