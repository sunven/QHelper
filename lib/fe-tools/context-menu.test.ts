import { describe, expect, it, vi } from 'vitest'
import {
  COPY_PAGE_TITLE_MENU_ID,
  copyPageTitleFromContextClick,
  ensureCopyPageTitleContextMenu,
} from './context-menu'

describe('fe-tools/context-menu', () => {
  it('creates the copy page title menu after removing stale state', async () => {
    const deps = {
      removeMenu: vi.fn(() => Promise.resolve()),
      createMenu: vi.fn(),
    }

    await ensureCopyPageTitleContextMenu(deps)

    expect(deps.removeMenu).toHaveBeenCalledWith(COPY_PAGE_TITLE_MENU_ID)
    expect(deps.createMenu).toHaveBeenCalledWith({
      id: COPY_PAGE_TITLE_MENU_ID,
      title: 'copy page title',
      contexts: ['all'],
    })
  })

  it('executes clipboard injection for the current tab title', async () => {
    const deps = {
      executeScript: vi.fn(() => Promise.resolve([])),
    }

    await copyPageTitleFromContextClick(
      { menuItemId: COPY_PAGE_TITLE_MENU_ID },
      { id: 42, title: 'Example Title' },
      deps,
    )

    expect(deps.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 42 },
        args: ['Example Title'],
      }),
    )
  })

  it('ignores missing tab id and non-matching menu id without throwing', async () => {
    const deps = {
      executeScript: vi.fn(() => Promise.resolve([])),
    }

    await expect(
      copyPageTitleFromContextClick(
        { menuItemId: COPY_PAGE_TITLE_MENU_ID },
        { title: 'No id' },
        deps,
      ),
    ).resolves.toBe(false)
    await expect(
      copyPageTitleFromContextClick({ menuItemId: 'other' }, { id: 1, title: 'Title' }, deps),
    ).resolves.toBe(false)
    expect(deps.executeScript).not.toHaveBeenCalled()
  })
})
