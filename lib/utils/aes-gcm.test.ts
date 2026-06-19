import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AES_GCM_ITERATIONS,
  decryptAesGcmText,
  encryptAesGcmText,
  parseAesGcmPayload,
} from './aes-gcm'

describe('aes-gcm', () => {
  it('encrypts and decrypts UTF-8 text with a passphrase', async () => {
    const payloadText = await encryptAesGcmText('邮箱📮', 'secret passphrase')
    const payload = parseAesGcmPayload(payloadText)

    expect(payloadText).not.toContain('邮箱')
    expect(payload).toMatchObject({
      v: 1,
      alg: 'AES-GCM',
      kdf: 'PBKDF2-SHA-256',
      iterations: DEFAULT_AES_GCM_ITERATIONS,
    })
    expect(payload.salt.length).toBeGreaterThan(0)
    expect(payload.iv.length).toBeGreaterThan(0)
    expect(payload.ciphertext.length).toBeGreaterThan(0)
    await expect(
      decryptAesGcmText(payloadText, 'secret passphrase'),
    ).resolves.toBe('邮箱📮')
  })

  it('uses fresh salt and IV for each encryption', async () => {
    const firstPayload = parseAesGcmPayload(
      await encryptAesGcmText('same text', 'secret passphrase'),
    )
    const secondPayload = parseAesGcmPayload(
      await encryptAesGcmText('same text', 'secret passphrase'),
    )

    expect(firstPayload.salt).not.toBe(secondPayload.salt)
    expect(firstPayload.iv).not.toBe(secondPayload.iv)
    expect(firstPayload.ciphertext).not.toBe(secondPayload.ciphertext)
  })

  it('rejects a wrong passphrase', async () => {
    const payloadText = await encryptAesGcmText('secret text', 'right passphrase')

    await expect(
      decryptAesGcmText(payloadText, 'wrong passphrase'),
    ).rejects.toThrow('AES-GCM decrypt failed')
  })

  it('rejects missing passphrases and invalid payloads', async () => {
    await expect(encryptAesGcmText('text', '')).rejects.toThrow(
      'Passphrase is required',
    )
    await expect(decryptAesGcmText('not-json', 'secret')).rejects.toThrow(
      'Invalid AES-GCM payload',
    )
    await expect(
      decryptAesGcmText(
        JSON.stringify({
          v: 1,
          alg: 'AES-GCM',
          kdf: 'PBKDF2-SHA-256',
          iterations: DEFAULT_AES_GCM_ITERATIONS,
          salt: '',
          iv: '',
          ciphertext: '',
        }),
        'secret',
      ),
    ).rejects.toThrow('Invalid AES-GCM payload')
  })

  it('rejects payloads with excessive KDF iterations before decryption', () => {
    expect(() =>
      parseAesGcmPayload(
        JSON.stringify({
          v: 1,
          alg: 'AES-GCM',
          kdf: 'PBKDF2-SHA-256',
          iterations: 1_000_001,
          salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
          iv: 'AAAAAAAAAAAAAAAA',
          ciphertext: 'AA==',
        }),
      ),
    ).toThrow('Invalid AES-GCM payload')
  })
})
