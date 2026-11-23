import { describe, expect, it } from 'vitest'
import { generatePasswordValue } from './password'

const allSelected = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
}

describe('password/generatePasswordValue', () => {
  it('includes at least one character from every selected class', () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const password = generatePasswordValue(allSelected, 16)

      expect(password).toHaveLength(16)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[^a-zA-Z0-9]/)
    }
  })

  it('applies character exclusions to the selected classes', () => {
    const password = generatePasswordValue(
      { ...allSelected, excludeSimilar: true },
      64,
    )

    expect(password).not.toMatch(/[il1Lo0O]/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[^a-zA-Z0-9]/)
  })

  it('falls back to lowercase when no class is selected', () => {
    const password = generatePasswordValue(
      {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        excludeSimilar: false,
        excludeAmbiguous: false,
      },
      12,
    )

    expect(password).toMatch(/^[a-z]{12}$/)
  })
})
