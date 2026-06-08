import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './ocr'

const { createWorker, worker } = vi.hoisted(() => {
  const worker = {
    recognize: vi.fn(),
    setParameters: vi.fn(),
    terminate: vi.fn(),
  }

  return {
    createWorker: vi.fn(),
    worker,
  }
})

vi.mock('tesseract.js', () => ({
  createWorker,
  PSM: {
    AUTO: '3',
  },
}))

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

describe('ocr/App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.local.get).mockImplementation(
      () => Promise.resolve({}) as never,
    )
    vi.mocked(chrome.storage.local.set).mockImplementation(
      () => Promise.resolve() as never,
    )
    createWorker.mockResolvedValue(worker)
    worker.recognize.mockResolvedValue({
      data: {
        text: ' Hello OCR \n',
        confidence: 91.25,
      },
    })
    worker.setParameters.mockResolvedValue(undefined)
    worker.terminate.mockResolvedValue(undefined)

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('recognizes selected image text with a local tesseract worker', async () => {
    const user = userEvent.setup()
    const file = new File(['image'], 'sample.png', { type: 'image/png' })

    render(<App />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file)
    await user.click(screen.getByRole('button', { name: '开始识别' }))

    await waitFor(() => {
      expect(createWorker).toHaveBeenCalledWith(
        'eng',
        undefined,
        expect.objectContaining({
          workerPath: '/libs/tesseract/worker.min.js',
          corePath: '/libs/tesseract',
          workerBlobURL: false,
        }),
      )
    })

    expect(worker.recognize).toHaveBeenCalledWith(file)
    expect(await screen.findByDisplayValue('Hello OCR')).toBeVisible()
    expect(screen.getByText('可信度 91.3%')).toBeVisible()
  })

  it('uses the previously selected OCR language from local storage', async () => {
    const user = userEvent.setup()
    const file = new File(['image'], 'sample.png', { type: 'image/png' })

    vi.mocked(chrome.storage.local.get).mockImplementationOnce(
      () => Promise.resolve({ tool_ocr_language: 'jpn' }) as never,
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('日本語')
    })

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file)
    await user.click(screen.getByRole('button', { name: '开始识别' }))

    await waitFor(() => {
      expect(createWorker).toHaveBeenCalledWith(
        'jpn',
        undefined,
        expect.objectContaining({
          workerPath: '/libs/tesseract/worker.min.js',
          corePath: '/libs/tesseract',
          workerBlobURL: false,
        }),
      )
    })
  })

  it('rejects non-image files before creating a worker', async () => {
    const file = new File(['text'], 'sample.txt', { type: 'text/plain' })

    render(<App />)

    const dropZone = screen.getByText('拖拽、粘贴或选择图片').closest('div')
      ?.parentElement

    expect(dropZone).toBeTruthy()
    fireEvent.drop(dropZone as HTMLElement, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(screen.getByText('请选择图片文件')).toBeVisible()
    expect(createWorker).not.toHaveBeenCalled()
  })
})
