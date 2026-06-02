import { compare, getRounds, hash } from 'bcryptjs'

export const MIN_BCRYPT_ROUNDS = 4
export const MAX_BCRYPT_ROUNDS = 15
export const DEFAULT_BCRYPT_ROUNDS = 10

const BCRYPT_HASH_PATTERN =
  /^\$2[aby]\$(0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}$/

export function normalizeBcryptRounds(rounds: number): number {
  if (!Number.isFinite(rounds)) {
    return DEFAULT_BCRYPT_ROUNDS
  }

  return Math.min(
    MAX_BCRYPT_ROUNDS,
    Math.max(MIN_BCRYPT_ROUNDS, Math.trunc(rounds)),
  )
}

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value.trim())
}

export function getBcryptHashRounds(value: string): number | null {
  const hashValue = value.trim()

  if (!isBcryptHash(hashValue)) {
    return null
  }

  return getRounds(hashValue)
}

export async function createBcryptHash(
  plainText: string,
  rounds = DEFAULT_BCRYPT_ROUNDS,
): Promise<string> {
  return hash(plainText, normalizeBcryptRounds(rounds))
}

export async function verifyBcryptHash(
  plainText: string,
  hashValue: string,
): Promise<boolean> {
  const normalizedHash = hashValue.trim()

  if (!isBcryptHash(normalizedHash)) {
    throw new Error('Invalid bcrypt hash')
  }

  return compare(plainText, normalizedHash)
}
