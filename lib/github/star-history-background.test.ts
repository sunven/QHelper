import { describe, expect, it, vi } from 'vitest';
import {
  STAR_HISTORY_SVG_MESSAGE,
  handleStarHistorySvgMessage,
  isStarHistorySvgMessage,
} from './star-history-background';

describe('isStarHistorySvgMessage', () => {
  it('accepts valid Star History SVG messages', () => {
    expect(
      isStarHistorySvgMessage({
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan', repo: 'gstack' },
        theme: 'light',
      }),
    ).toBe(true);
  });

  it('rejects unrelated or malformed messages', () => {
    expect(isStarHistorySvgMessage({ type: 'OTHER' })).toBe(false);
    expect(
      isStarHistorySvgMessage({
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan' },
        theme: 'light',
      }),
    ).toBe(false);
    expect(
      isStarHistorySvgMessage({
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan', repo: 'gstack' },
        theme: 'sepia',
      }),
    ).toBe(false);
  });
});

describe('handleStarHistorySvgMessage', () => {
  it('fetches the requested light SVG through the background page', async () => {
    const sendResponse = vi.fn();
    const fetchText = vi.fn(() => Promise.resolve('<svg>light</svg>'));

    const handled = handleStarHistorySvgMessage(
      {
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan', repo: 'gstack' },
        theme: 'light',
      },
      sendResponse,
      { fetchText },
    );

    expect(handled).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, svg: '<svg>light</svg>' });
    });
    expect(fetchText).toHaveBeenCalledWith(
      'https://api.star-history.com/svg?repos=garrytan/gstack&type=Date',
    );
  });

  it('fetches the requested dark SVG through the background page', async () => {
    const sendResponse = vi.fn();
    const fetchText = vi.fn(() => Promise.resolve('<svg>dark</svg>'));

    handleStarHistorySvgMessage(
      {
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan', repo: 'gstack' },
        theme: 'dark',
      },
      sendResponse,
      { fetchText },
    );

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, svg: '<svg>dark</svg>' });
    });
    expect(fetchText).toHaveBeenCalledWith(
      'https://api.star-history.com/svg?repos=garrytan/gstack&type=Date&theme=dark',
    );
  });

  it('returns an error response when the fetch fails', async () => {
    const sendResponse = vi.fn();

    handleStarHistorySvgMessage(
      {
        type: STAR_HISTORY_SVG_MESSAGE,
        repo: { owner: 'garrytan', repo: 'gstack' },
        theme: 'light',
      },
      sendResponse,
      {
        fetchText: () => Promise.reject(new Error('network failed')),
      },
    );

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        error: 'network failed',
      });
    });
  });

  it('ignores unrelated messages', () => {
    const sendResponse = vi.fn();

    expect(handleStarHistorySvgMessage({ type: 'OTHER' }, sendResponse)).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
