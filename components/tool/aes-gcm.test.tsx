import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AesGcmTool } from './aes-gcm'

describe('aes-gcm/AesGcmTool', () => {
  it('encrypts text and decrypts the generated payload', async () => {
    const user = userEvent.setup()

    render(<AesGcmTool />)

    await user.type(screen.getByLabelText('明文'), 'secret text')
    await user.type(screen.getAllByLabelText('口令')[0], 'passphrase')
    await user.click(screen.getByRole('button', { name: '加密' }))

    await waitFor(() => {
      expect(screen.getByText('加密完成')).toBeVisible()
    })

    const payload = screen.getAllByLabelText(
      'Payload JSON',
    )[0] as HTMLTextAreaElement

    expect(payload.value).toContain('"alg":"AES-GCM"')
    expect(payload.value).not.toContain('secret text')

    await user.type(screen.getAllByLabelText('口令')[1], 'passphrase')
    await user.click(screen.getByRole('button', { name: '解密' }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('secret text')).toBeVisible()
    })
  })
})
