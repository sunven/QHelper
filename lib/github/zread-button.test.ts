import { describe, expect, it } from 'vitest';
import {
  ZREAD_BUTTON_ID,
  buildZreadUrl,
  parseRepoCoordinates,
  syncZreadButton,
} from './zread-button';

function renderGitHubHeader(hasActionList = true): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="Yeachan-Heo/oh-my-codex"
    />
  `;
  document.body.innerHTML = `
    <div id="repository-container-header">
      <div id="repository-details-container">
        ${
          hasActionList
            ? `
          <ul class="pagehead-actions flex-shrink-0 d-none d-md-inline">
            <li><a id="repository-details-watch-button" class="btn-sm btn">Watch</a></li>
            <li><a id="fork-button" class="btn-sm btn">Fork</a></li>
            <li><a class="btn-sm btn">Star</a></li>
          </ul>
        `
            : ''
        }
      </div>
    </div>
  `;
}

describe('parseRepoCoordinates', () => {
  it('parses repository root paths', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
  });

  it('rejects GitHub repository subpages', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/issues')).toBeNull();
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/blob/main/README.md')).toBeNull();
  });
});

describe('buildZreadUrl', () => {
  it('maps owner/repo to zread.ai', () => {
    expect(
      buildZreadUrl({
        owner: 'Yeachan-Heo',
        repo: 'oh-my-codex',
      }),
    ).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
  });
});

describe('syncZreadButton', () => {
  it('renders a single Zread button on repository root pages', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const button = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Zread');
    expect(button?.href).toBe('https://zread.ai/Yeachan-Heo/oh-my-codex');
    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('does not render on repository subpages', () => {
    renderGitHubHeader();

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('does not render on non-repository two-segment paths', () => {
    renderGitHubHeader();
    document.head.innerHTML = '';

    expect(syncZreadButton(document, '/features/copilot')).toBe(false);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('preserves existing vscode.dev links on unsupported pages', () => {
    renderGitHubHeader();
    const legacyAnchor = document.createElement('a');
    legacyAnchor.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    legacyAnchor.textContent = 'vscode.dev';
    document.querySelector('#repository-details-container')?.append(legacyAnchor);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBe(legacyAnchor);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('removes legacy vscode.dev buttons on unsupported pages', () => {
    renderGitHubHeader();
    const legacyButton = document.createElement('a');
    legacyButton.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    legacyButton.textContent = 'vscode.dev';
    legacyButton.className = 'btn';
    document.querySelector('#repository-details-container')?.append(legacyButton);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBeNull();
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('preserves unrelated vscode.dev buttons outside the repository header', () => {
    renderGitHubHeader();
    const outsideButton = document.createElement('a');
    outsideButton.id = 'outside';
    outsideButton.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    outsideButton.textContent = 'vscode.dev';
    outsideButton.className = 'btn';
    document.body.append(outsideButton);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues')).toBe(false);

    expect(document.querySelector('#outside')).toBe(outsideButton);
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });

  it('preserves non-button vscode.dev links on repository root pages', () => {
    renderGitHubHeader();
    const readmeLink = document.createElement('a');
    readmeLink.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    readmeLink.textContent = 'Open docs in vscode.dev';
    document.body.append(readmeLink);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    expect(document.querySelector('a[href="https://vscode.dev/github/Yeachan-Heo/oh-my-codex"]')).toBe(
      readmeLink,
    );
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('falls back to a visible repository header container when the action list is unavailable', () => {
    renderGitHubHeader(false);

    expect(syncZreadButton(document, '/Yeachan-Heo/oh-my-codex')).toBe(true);

    const fallbackButton = document.querySelector<HTMLAnchorElement>(`#${ZREAD_BUTTON_ID}`);
    expect(fallbackButton).not.toBeNull();
    expect(document.querySelector('#repository-details-container > div[data-qhelper-zread-wrapper="true"]')).not.toBeNull();
  });

  it('removes legacy vscode.dev buttons before rendering the Zread button', () => {
    renderGitHubHeader();
    const legacyAnchor = document.createElement('a');
    legacyAnchor.href = 'https://vscode.dev/github/Yeachan-Heo/oh-my-codex';
    legacyAnchor.textContent = 'vscode.dev';
    legacyAnchor.className = 'btn';
    document.querySelector('#repository-details-container')?.append(legacyAnchor);

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');

    expect(document.querySelector('a[href^="https://vscode.dev/github/"]')).toBeNull();
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();
  });

  it('re-renders without duplicating the injected button', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');

    expect(document.querySelectorAll(`#${ZREAD_BUTTON_ID}`)).toHaveLength(1);
  });

  it('removes the injected Zread button after leaving the repository root page', () => {
    renderGitHubHeader();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex');
    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).not.toBeNull();

    syncZreadButton(document, '/Yeachan-Heo/oh-my-codex/issues');

    expect(document.querySelector(`#${ZREAD_BUTTON_ID}`)).toBeNull();
  });
});
