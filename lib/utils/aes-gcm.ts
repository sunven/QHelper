export const DEFAULT_AES_GCM_ITERATIONS = 210_000
export const MAX_AES_GCM_ITERATIONS = 1_000_000

const AES_GCM_SALT_BYTES = 16
const AES_GCM_IV_BYTES = 12
const AES_GCM_KEY_BITS = 256
const AES_GCM_TAG_BITS = 128
const BASE64_CHUNK_SIZE = 0x8000

export type AesGcmPayload = {
  v: 1
  alg: 'AES-GCM'
  kdf: 'PBKDF2-SHA-256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('Web Crypto API is not available')
  }

  return globalThis.crypto
}

function assertPassphrase(passphrase: string): void {
  if (!passphrase) {
    throw new Error('Passphrase is required')
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + BASE64_CHUNK_SIZE),
    )
  }

  return btoa(binary)
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.trim())
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function isPayload(value: unknown): value is AesGcmPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.v === 1 &&
    candidate.alg === 'AES-GCM' &&
    candidate.kdf === 'PBKDF2-SHA-256' &&
    Number.isInteger(candidate.iterations) &&
    Number(candidate.iterations) > 0 &&
    Number(candidate.iterations) <= MAX_AES_GCM_ITERATIONS &&
    typeof candidate.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string'
  )
}

export function parseAesGcmPayload(payloadText: string): AesGcmPayload {
  try {
    const payload = JSON.parse(payloadText.trim()) as unknown

    if (!isPayload(payload)) {
      throw new Error('Invalid AES-GCM payload')
    }

    const salt = base64ToBytes(payload.salt)
    const iv = base64ToBytes(payload.iv)
    const ciphertext = base64ToBytes(payload.ciphertext)

    if (
      salt.length !== AES_GCM_SALT_BYTES ||
      iv.length !== AES_GCM_IV_BYTES ||
      ciphertext.length === 0
    ) {
      throw new Error('Invalid AES-GCM payload')
    }

    return payload
  } catch {
    throw new Error('Invalid AES-GCM payload')
  }
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  cryptoRef: Crypto,
): Promise<CryptoKey> {
  const keyMaterial = await cryptoRef.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return cryptoRef.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: bytesToArrayBuffer(salt),
      iterations,
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: AES_GCM_KEY_BITS,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptAesGcmText(
  plainText: string,
  passphrase: string,
): Promise<string> {
  assertPassphrase(passphrase)

  const cryptoRef = getCrypto()
  const salt = cryptoRef.getRandomValues(new Uint8Array(AES_GCM_SALT_BYTES))
  const iv = cryptoRef.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES))
  const key = await deriveAesGcmKey(
    passphrase,
    salt,
    DEFAULT_AES_GCM_ITERATIONS,
    cryptoRef,
  )
  const ciphertext = await cryptoRef.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: AES_GCM_TAG_BITS,
    },
    key,
    new TextEncoder().encode(plainText),
  )
  const payload: AesGcmPayload = {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: DEFAULT_AES_GCM_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }

  return JSON.stringify(payload)
}

export async function decryptAesGcmText(
  payloadText: string,
  passphrase: string,
): Promise<string> {
  assertPassphrase(passphrase)

  const cryptoRef = getCrypto()
  const payload = parseAesGcmPayload(payloadText)
  const key = await deriveAesGcmKey(
    passphrase,
    base64ToBytes(payload.salt),
    payload.iterations,
    cryptoRef,
  )

  try {
    const plainText = await cryptoRef.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bytesToArrayBuffer(base64ToBytes(payload.iv)),
        tagLength: AES_GCM_TAG_BITS,
      },
      key,
      bytesToArrayBuffer(base64ToBytes(payload.ciphertext)),
    )

    return new TextDecoder().decode(plainText)
  } catch {
    throw new Error('AES-GCM decrypt failed')
  }
}
