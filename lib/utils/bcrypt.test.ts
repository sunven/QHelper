import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BCRYPT_ROUNDS,
  createBcryptHash,
  getBcryptHashRounds,
  isBcryptHash,
  normalizeBcryptRounds,
  verifyBcryptHash,
} from './bcrypt'

describe('bcrypt utils', () => {
  it('creates and verifies bcrypt hashes', async () => {
    const hash = await createBcryptHash('correct horse battery staple', 4)

    expect(hash).toMatch(/^\$2b\$04\$[./A-Za-z0-9]{53}$/)
    expect(isBcryptHash(hash)).toBe(true)
    expect(getBcryptHashRounds(hash)).toBe(4)
    await expect(
      verifyBcryptHash('correct horse battery staple', hash),
    ).resolves.toBe(true)
    await expect(verifyBcryptHash('wrong password', hash)).resolves.toBe(false)
  })

  it('rejects invalid bcrypt hash strings before comparison', async () => {
    expect(isBcryptHash('not-a-bcrypt-hash')).toBe(false)
    expect(getBcryptHashRounds('not-a-bcrypt-hash')).toBeNull()
    await expect(verifyBcryptHash('secret', 'not-a-bcrypt-hash')).rejects.toThrow(
      'Invalid bcrypt hash',
    )
  })

  it('accepts bcrypt hashes above the browser generation limit for verification', () => {
    const highCostHash = `$2b$31$${'a'.repeat(53)}`

    expect(isBcryptHash(highCostHash)).toBe(true)
    expect(getBcryptHashRounds(highCostHash)).toBe(31)
  })

  it('normalizes rounds to the browser-safe supported range', () => {
    expect(normalizeBcryptRounds(1)).toBe(4)
    expect(normalizeBcryptRounds(12.8)).toBe(12)
    expect(normalizeBcryptRounds(31)).toBe(15)
    expect(normalizeBcryptRounds(Number.NaN)).toBe(DEFAULT_BCRYPT_ROUNDS)
  })
})
