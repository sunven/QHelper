import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { parseText } from '@/lib/text-preview/parser/pipeline'
import { ResultList } from './ResultList'

describe('Text Preview ResultList', () => {
  it('renders fixed result groups and line rows', () => {
    render(
      <ResultList
        copyState={{}}
        hasInput
        onCopy={vi.fn()}
        result={parseText(
          [
            '10.0.0.1 https://example.invalid/a',
            'kubectl get pods',
            '/var/log/nginx/access.log',
          ].join('\n'),
        )}
        tabId="tab-1"
      />,
    )

    const results = screen.getByText('4 个可复制对象').closest('div')
      ?.parentElement?.parentElement
    expect(results).toBeTruthy()
    expect(screen.getAllByText('IP 地址').length).toBeGreaterThan(0)
    expect(screen.getAllByText('URL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('命令').length).toBeGreaterThan(0)
    expect(screen.getAllByText('路径').length).toBeGreaterThan(0)

    const firstLine = screen.getByRole('group', { name: '第 1 行提取结果' })
    expect(within(firstLine).getByText('10.0.0.1')).toBeVisible()
    expect(within(firstLine).getByText('https://example.invalid/a')).toBeVisible()

    const secondLine = screen.getByRole('group', { name: '第 2 行提取结果' })
    expect(within(secondLine).getByText('kubectl get pods')).toBeVisible()

    const thirdLine = screen.getByRole('group', { name: '第 3 行提取结果' })
    expect(
      within(thirdLine).getByText('/var/log/nginx/access.log'),
    ).toBeVisible()
  })

  it('sends copy-all values separated by newlines', () => {
    const onCopy = vi.fn()

    render(
      <ResultList
        copyState={{}}
        hasInput
        onCopy={onCopy}
        result={parseText('10.0.0.1\n10.0.0.2')}
        tabId="tab-1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '复制全部对象' }))

    expect(onCopy).toHaveBeenCalledWith('tab-1:all', '10.0.0.1\n10.0.0.2')
  })
})
