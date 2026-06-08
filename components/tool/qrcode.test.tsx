import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './qrcode'

const { html5QrcodeInstances, Html5Qrcode, scanFile, start, stop, clear } =
  vi.hoisted(() => {
    const html5QrcodeInstances: Array<{
      clear: ReturnType<typeof vi.fn>
      scanFile: ReturnType<typeof vi.fn>
      start: ReturnType<typeof vi.fn>
      stop: ReturnType<typeof vi.fn>
      isScanning: boolean
    }> = []
    const scanFile = vi.fn()
    const start = vi.fn()
    const stop = vi.fn()
    const clear = vi.fn()
    const Html5Qrcode = vi.fn(function () {
      const instance = {
        clear,
        scanFile,
        start,
        stop,
        isScanning: false,
      }

      html5QrcodeInstances.push(instance)
      return instance
    })

    return {
      html5QrcodeInstances,
      Html5Qrcode,
      scanFile,
      start,
      stop,
      clear,
    }
  })

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({
    bgColor: _bgColor,
    fgColor: _fgColor,
    level: _level,
    marginSize: _marginSize,
    size: _size,
    title,
    value,
    ...props
  }: {
    bgColor?: string
    fgColor?: string
    level?: string
    marginSize?: number
    size?: number
    title?: string
    value: string
  }) => <svg aria-label={title} data-value={value} {...props} />,
}))

vi.mock('html5-qrcode', () => ({
  Html5Qrcode,
  Html5QrcodeSupportedFormats: {
    QR_CODE: 0,
  },
}))

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

describe('qrcode/App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    html5QrcodeInstances.length = 0
    scanFile.mockResolvedValue('https://example.com/from-image')
    start.mockResolvedValue(null)
    stop.mockResolvedValue(undefined)
    clear.mockReturnValue(undefined)
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.local.set).mockImplementation(
      () => Promise.resolve() as never,
    )

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:qrcode-preview'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a QR code from typed content', async () => {
    const user = userEvent.setup()

    render(<App />)

    const input = screen.getByLabelText('内容')
    await user.clear(input)
    await user.type(input, 'hello qr')

    expect(screen.getByLabelText('QHelper QR Code')).toHaveAttribute(
      'data-value',
      'hello qr',
    )
  })

  it('downloads the generated QR code as SVG', async () => {
    const user = userEvent.setup()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    render(<App />)

    await user.click(screen.getByRole('button', { name: '下载 SVG' }))

    expect(URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image/svg+xml;charset=utf-8' }),
    )
    expect(click).toHaveBeenCalled()

    click.mockRestore()
  })

  it('scans a selected image file with html5-qrcode', async () => {
    const user = userEvent.setup()
    const file = new File(['image'], 'qrcode.png', { type: 'image/png' })

    render(<App />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file)
    await user.click(screen.getByRole('button', { name: '识别图片' }))

    await waitFor(() => {
      expect(Html5Qrcode).toHaveBeenCalledWith(
        expect.stringContaining('qhelper-qrcode-file-reader-'),
        expect.objectContaining({
          formatsToSupport: [0],
          verbose: false,
        }),
      )
    })

    expect(scanFile).toHaveBeenCalledWith(file, false)
    expect(await screen.findByDisplayValue('https://example.com/from-image')).toBeVisible()
    expect(screen.getByText('图片识别完成')).toBeVisible()
    expect(clear).toHaveBeenCalled()
  })

  it('rejects non-image files before scanning', async () => {
    const file = new File(['text'], 'qrcode.txt', { type: 'text/plain' })

    render(<App />)

    const dropZone = screen.getByText('拖拽或选择图片').closest('div')
      ?.parentElement

    expect(dropZone).toBeTruthy()
    fireEvent.drop(dropZone as HTMLElement, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(await screen.findByText('请选择图片文件')).toBeVisible()
    expect(Html5Qrcode).not.toHaveBeenCalled()
  })

  it('starts and stops camera scanning', async () => {
    const user = userEvent.setup()
    start.mockImplementation(async (_camera, _config, onSuccess) => {
      html5QrcodeInstances[0].isScanning = true
      onSuccess('camera result')
      return null
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: '摄像头' }))

    await waitFor(() => {
      expect(start).toHaveBeenCalledWith(
        { facingMode: 'environment' },
        expect.objectContaining({
          fps: 10,
          qrbox: { width: 240, height: 240 },
        }),
        expect.any(Function),
        expect.any(Function),
      )
    })

    expect(await screen.findByDisplayValue('camera result')).toBeVisible()
    expect(stop).toHaveBeenCalled()
    expect(clear).toHaveBeenCalled()
  })
})
