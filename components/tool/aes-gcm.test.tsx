import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from './aes-gcm'

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))

describe('aes-gcm/App', () => {
  it('encrypts text and decrypts the generated payload', async () => {
    const user = userEvent.setup()

    render(<App />)

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
