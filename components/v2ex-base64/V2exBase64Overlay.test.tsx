import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { V2exBase64Overlay } from './V2exBase64Overlay'

describe('V2exBase64Overlay', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('keeps entries hidden until the trigger is opened', () => {
    render(<V2exBase64Overlay entries={['user@example.com']} />)

    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '打开 V2EX Base64' }))

    expect(screen.getByRole('dialog', { name: 'V2EX Base64' })).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('copies the Base64 value for a row', async () => {
    const copyText = vi.fn().mockResolvedValue(undefined)
    render(
      <V2exBase64Overlay entries={['user@example.com']} copyText={copyText} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '打开 V2EX Base64' }))
    fireEvent.click(screen.getByRole('button', { name: '复制第 1 行 Base64' }))

    await waitFor(() => {
      expect(copyText).toHaveBeenCalledWith('dXNlckBleGFtcGxlLmNvbQ==')
    })
    expect(await screen.findByText('已复制')).toBeInTheDocument()
    expect(screen.getByText('第 1 行已复制')).toBeInTheDocument()
  })

  it('shows per-row copy failure feedback', async () => {
    const copyText = vi.fn().mockRejectedValue(new Error('blocked'))
    render(
      <V2exBase64Overlay entries={['user@example.com']} copyText={copyText} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '打开 V2EX Base64' }))
    fireEvent.click(screen.getByRole('button', { name: '复制第 1 行 Base64' }))

    expect(await screen.findByText('复制失败')).toBeInTheDocument()
    expect(screen.getByText('第 1 行复制失败')).toBeInTheDocument()
  })

  it('closes with Escape and returns focus to the trigger', async () => {
    render(<V2exBase64Overlay entries={['user@example.com']} />)

    const trigger = screen.getByRole('button', { name: '打开 V2EX Base64' })
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', { name: 'V2EX Base64' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'V2EX Base64' }),
      ).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(trigger).toHaveFocus()
    })
  })

  it('keeps the panel open when closed-shadow events are retargeted to the host', () => {
    render(<V2exBase64Overlay entries={['user@example.com']} />)

    fireEvent.click(screen.getByRole('button', { name: '打开 V2EX Base64' }))

    const panel = screen.getByRole('dialog', { name: 'V2EX Base64' })
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'closed' })
    document.body.append(host)
    shadowRoot.append(panel)

    fireEvent.pointerDown(host)

    expect(panel).toBeInTheDocument()
    host.remove()
  })
})
