import { describe, expect, it } from 'vitest'
import { parseJwt } from './jwt'

describe('parseJwt', () => {
  it('decodes base64url header and payload JSON without verifying signature', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiUXVpbm4iLCJhZG1pbiI6dHJ1ZX0.signature'

    expect(parseJwt(token)).toEqual({
      header: {
        alg: 'HS256',
        typ: 'JWT',
      },
      payload: {
        sub: '123',
        name: 'Quinn',
        admin: true,
      },
      signature: 'signature',
    })
  })

  it('returns null for tokens without three segments', () => {
    expect(parseJwt('not-a-jwt')).toBeNull()
  })

  it('returns null when header or payload is not a JSON object', () => {
    const tokenWithArrayPayload =
      'eyJhbGciOiJIUzI1NiJ9.WyJub3QiLCJhbiIsIm9iamVjdCJd.signature'

    expect(parseJwt(tokenWithArrayPayload)).toBeNull()
  })

  it('returns null for invalid base64url segments', () => {
    expect(parseJwt('!.eyJzdWIiOiIxMjMifQ.signature')).toBeNull()
  })
})
