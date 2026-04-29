import { beforeEach, describe, expect, it, vi } from 'vitest';

const COPY_URL_LABEL = /(?:copy\s+)?url/i;
const COPY_SCRIPT_LABEL = /script/i;
const COPY_LINK_LABEL = /(?:link|stylesheet)/i;
const CLICKABLE_SELECTOR = 'button, a, [role="button"], input[type="button"], input[type="submit"]';
const ACTION_CELL_SELECTOR = 'td[data-qhelper-unpkg-copy-cell="true"]';

async function loadCopyActions() {
  return import('./copy-actions');
}

function createFakeWindow(url: string): Window {
  return {
    location: new URL(url),
    navigator: window.navigator,
  } as unknown as Window;
}

function renderBrowseListingPage(): {
  jsRow: HTMLTableRowElement;
  cssRow: HTMLTableRowElement;
  otherRow: HTMLTableRowElement;
  placeholderRow: HTMLTableRowElement;
} {
  document.head.innerHTML = '<base href="https://www.unpkg.com/browse/react@18.3.1/dist/" />';
  document.body.innerHTML = `
    <table>
      <tbody>
        <tr data-row="js">
          <td>file</td>
          <td>
            <a class="file-link" href="https://www.unpkg.com/react@18.3.1/dist/react.production.min.js">
              not-the-real-file-name.txt
            </a>
          </td>
          <td>12 kB</td>
        </tr>
        <tr data-row="css">
          <td>file</td>
          <td>
            <a class="file-link" href="/react@18.3.1/dist/styles.css">
              definitely-not-styles.js
            </a>
          </td>
          <td>4 kB</td>
        </tr>
        <tr data-row="other">
          <td>file</td>
          <td>
            <a class="file-link" href="/react@18.3.1/dist/README.md">
              misleading-script.js
            </a>
          </td>
          <td>2 kB</td>
        </tr>
        <tr data-row="placeholder">
          <td>file</td>
          <td>
            <a class="file-link" href="/react@18.3.1/dist/folder/">misleading-file.js</a>
          </td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
  `;

  return {
    jsRow: requireRow('js'),
    cssRow: requireRow('css'),
    otherRow: requireRow('other'),
    placeholderRow: requireRow('placeholder'),
  };
}

function renderAppListingPage(): HTMLTableRowElement {
  document.head.innerHTML = '<base href="https://app.unpkg.com/react@18.3.1/files/" />';
  document.body.innerHTML = `
    <table>
      <tbody>
        <tr data-row="app-js">
          <td>file</td>
          <td>
            <a class="file-link" href="/react@18.3.1/files/index.js">misleading-name.css</a>
          </td>
          <td>12 kB</td>
        </tr>
      </tbody>
    </table>
  `;

  return requireRow('app-js');
}

function renderBrowseDetailPage(rawHref: string): HTMLAnchorElement {
  document.head.innerHTML = '<base href="https://www.unpkg.com/browse/react@18.3.1/dist/" />';
  document.body.innerHTML = `
    <main>
      <nav class="breadcrumbs">
        <a class="raw-link" href="${rawHref}">View Raw</a>
      </nav>
    </main>
  `;

  const anchor = document.querySelector<HTMLAnchorElement>('a.raw-link');
  if (!anchor) {
    throw new Error('Expected raw-link anchor to exist.');
  }
  return anchor;
}

function renderLegacyBrowseDetailPage(assetHref: string, assetLabel = 'current asset'): HTMLAnchorElement {
  document.head.innerHTML = '<base href="https://www.unpkg.com/browse/react@18.3.1/dist/" />';
  document.body.innerHTML = `
    <main>
      <nav class="breadcrumbs">
        <a class="current-file" href="${assetHref}">${assetLabel}</a>
      </nav>
    </main>
  `;

  const anchor = document.querySelector<HTMLAnchorElement>('a.current-file');
  if (!anchor) {
    throw new Error('Expected current-file anchor to exist.');
  }
  return anchor;
}

function requireRow(name: string): HTMLTableRowElement {
  const row = document.querySelector<HTMLTableRowElement>(`tr[data-row="${name}"]`);
  if (!row) {
    throw new Error(`Expected ${name} row to exist.`);
  }
  return row;
}

function queryAction(container: ParentNode, label: RegExp): HTMLElement | null {
  return Array.from(container.querySelectorAll<HTMLElement>(CLICKABLE_SELECTOR)).find((element) => {
    if (element.classList.contains('file-link') || element.classList.contains('current-file')) {
      return false;
    }

    const labelCandidates = [
      element.textContent,
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.getAttribute('data-action'),
    ]
      .filter(Boolean)
      .join(' ');

    return label.test(labelCandidates);
  }) ?? null;
}

function expectAction(container: ParentNode, label: RegExp): HTMLElement {
  const action = queryAction(container, label);
  expect(action).not.toBeNull();
  return action as HTMLElement;
}

describe('syncUnpkgCopyActions', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('adds URL and script-tag actions for JavaScript listing rows', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { jsRow } = renderBrowseListingPage();

    expect(
      syncUnpkgCopyActions(
        createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'),
        document,
      ),
    ).toBe(true);

    expect(queryAction(jsRow, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(jsRow, COPY_SCRIPT_LABEL)).not.toBeNull();
  });

  it('adds URL and link-tag actions for stylesheet listing rows', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { cssRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expect(queryAction(cssRow, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(cssRow, COPY_LINK_LABEL)).not.toBeNull();
  });

  it('adds only a URL action for non-script listing rows', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { otherRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expect(queryAction(otherRow, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(otherRow, COPY_SCRIPT_LABEL)).toBeNull();
    expect(queryAction(otherRow, COPY_LINK_LABEL)).toBeNull();
  });

  it('skips placeholder listing rows without a concrete file asset', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { placeholderRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expect(queryAction(placeholderRow, COPY_URL_LABEL)).toBeNull();
    expect(queryAction(placeholderRow, COPY_SCRIPT_LABEL)).toBeNull();
    expect(queryAction(placeholderRow, COPY_LINK_LABEL)).toBeNull();
  });

  it('copies the normalized raw asset URL from the listing-row href', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { jsRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expectAction(jsRow, COPY_URL_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(
      'https://www.unpkg.com/react@18.3.1/dist/react.production.min.js',
    );
  });

  it('copies the exact script-tag payload for JavaScript listing rows', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { jsRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expectAction(jsRow, COPY_SCRIPT_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(
      '<script src="https://www.unpkg.com/react@18.3.1/dist/react.production.min.js"></script>',
    );
  });

  it('copies the exact stylesheet-tag payload for stylesheet listing rows', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { cssRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expectAction(cssRow, COPY_LINK_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(
      '<link rel="stylesheet" href="https://www.unpkg.com/react@18.3.1/dist/styles.css" />',
    );
  });

  it('normalizes app.unpkg.com/files listing links to raw unpkg URLs', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const appRow = renderAppListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://app.unpkg.com/react@18.3.1/files/'), document);

    expectAction(appRow, COPY_SCRIPT_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(
      '<script src="https://unpkg.com/react@18.3.1/index.js"></script>',
    );
  });

  it('adds URL and script-tag actions on JavaScript browse detail pages', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    renderBrowseDetailPage('https://unpkg.com/react@18.3.1/dist/react.production.min.js');

    expect(
      syncUnpkgCopyActions(
        createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/react.production.min.js'),
        document,
      ),
    ).toBe(true);

    expect(queryAction(document, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(document, COPY_SCRIPT_LABEL)).not.toBeNull();
  });

  it('adds URL and link-tag actions on stylesheet browse detail pages', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    renderBrowseDetailPage('https://unpkg.com/react@18.3.1/dist/styles.css');

    syncUnpkgCopyActions(
      createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/styles.css'),
      document,
    );

    expect(queryAction(document, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(document, COPY_LINK_LABEL)).not.toBeNull();
  });

  it('omits markup-tag actions on unsupported browse detail pages', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    renderBrowseDetailPage('https://unpkg.com/react@18.3.1/dist/README.md');

    syncUnpkgCopyActions(
      createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/README.md'),
      document,
    );

    expect(queryAction(document, COPY_URL_LABEL)).not.toBeNull();
    expect(queryAction(document, COPY_SCRIPT_LABEL)).toBeNull();
    expect(queryAction(document, COPY_LINK_LABEL)).toBeNull();
  });

  it('keeps app.unpkg.com detail actions aligned with the View Raw link', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    renderBrowseDetailPage('https://unpkg.com/react@18.3.1/styles.css');

    syncUnpkgCopyActions(
      createFakeWindow('https://app.unpkg.com/react@18.3.1/files/styles.css'),
      document,
    );

    expectAction(document, COPY_LINK_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(
      '<link rel="stylesheet" href="https://unpkg.com/react@18.3.1/styles.css" />',
    );
  });

  it('uses the raw-link href instead of the detail label text for copied URLs', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    renderLegacyBrowseDetailPage('/react@18.3.1/dist/styles.css', 'not-the-real-file-name.js');

    syncUnpkgCopyActions(
      createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/styles.css'),
      document,
    );

    expectAction(document, COPY_URL_LABEL).click();

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith('https://www.unpkg.com/react@18.3.1/dist/styles.css');
  });

  it('does not duplicate injected controls when sync runs twice', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    const { jsRow } = renderBrowseListingPage();

    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);
    syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document);

    expect(jsRow.querySelectorAll(ACTION_CELL_SELECTOR)).toHaveLength(1);
    expect(jsRow.children).toHaveLength(4);
    expect(jsRow.querySelectorAll(CLICKABLE_SELECTOR)).toHaveLength(3);
  });

  it('returns false when the current DOM does not match a supported listing or detail shape', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    document.body.innerHTML = '<main><p>unsupported page</p></main>';

    expect(syncUnpkgCopyActions(createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/'), document)).toBe(false);
    expect(queryAction(document, COPY_URL_LABEL)).toBeNull();
  });

  it('returns false when a browse detail page has no matching raw asset anchor', async () => {
    const { syncUnpkgCopyActions } = await loadCopyActions();
    document.head.innerHTML = '<base href="https://www.unpkg.com/browse/react@18.3.1/dist/" />';
    document.body.innerHTML = `
      <main>
        <nav class="breadcrumbs">
          <a class="current-file" href="https://www.unpkg.com/react@18.3.1/dist/another-file.js">
            react.production.min.js
          </a>
        </nav>
      </main>
    `;

    expect(
      syncUnpkgCopyActions(
        createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/react.production.min.js'),
        document,
      ),
    ).toBe(false);
    expect(queryAction(document, COPY_URL_LABEL)).toBeNull();
  });
});

describe('installUnpkgCopyActions', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('does not duplicate controls when the installer is called repeatedly', async () => {
    const { installUnpkgCopyActions } = await loadCopyActions();
    const { jsRow } = renderBrowseListingPage();
    const fakeWindow = createFakeWindow('https://www.unpkg.com/browse/react@18.3.1/dist/');

    installUnpkgCopyActions(fakeWindow, document);
    installUnpkgCopyActions(fakeWindow, document);

    expect(jsRow.querySelectorAll(ACTION_CELL_SELECTOR)).toHaveLength(1);
    expect(jsRow.children).toHaveLength(4);
    expect(jsRow.querySelectorAll(CLICKABLE_SELECTOR)).toHaveLength(3);
  });
});
