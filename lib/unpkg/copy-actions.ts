export const UNPKG_COPY_WRAPPER_SELECTOR = '[data-qhelper-unpkg-copy-wrapper="true"]';
const UNPKG_COPY_CELL_SELECTOR = '[data-qhelper-unpkg-copy-cell="true"]';

const LISTING_ROW_SELECTOR = 'table tbody tr';
const CURRENT_APP_HOST = 'app.unpkg.com';
const RAW_HOST = 'unpkg.com';
const ACTION_CONTROL_STYLE = [
  'border:0',
  'padding:0',
  'background:none',
  'color:#2563eb',
  'cursor:pointer',
  'font:inherit',
  'text-decoration:underline',
].join(';');

type CopyVariant = 'url' | 'script' | 'link';
export type AssetKind = 'js' | 'css' | 'other';

interface UnpkgActionTarget {
  rawUrl: string;
  kind: AssetKind;
}

function normalizeUnpkgPath(pathname: string): string {
  if (pathname.startsWith('/browse/')) {
    return pathname.replace('/browse/', '/');
  }

  if (pathname.includes('/files/')) {
    return pathname.replace('/files/', '/');
  }

  return pathname;
}

export function normalizeUnpkgAssetUrl(input: string, baseUrl = 'https://www.unpkg.com/'): string {
  const parsed = new URL(input, baseUrl);
  const base = new URL(baseUrl);
  const normalized = new URL(parsed.toString());

  normalized.pathname = normalizeUnpkgPath(parsed.pathname);
  normalized.protocol = base.protocol;
  normalized.hostname = base.hostname === CURRENT_APP_HOST ? RAW_HOST : base.hostname;
  normalized.port = base.hostname === CURRENT_APP_HOST ? '' : base.port;

  return normalized.toString();
}

export function detectAssetKind(url: string): AssetKind {
  if (/\.m?js(?:[?#]|$)/i.test(url)) {
    return 'js';
  }

  if (/\.css(?:[?#]|$)/i.test(url)) {
    return 'css';
  }

  return 'other';
}

export function buildCopyText(rawUrl: string, variant: CopyVariant = 'url'): string {
  if (variant === 'script') {
    return `<script src="${rawUrl}"></script>`;
  }

  if (variant === 'link') {
    return `<link rel="stylesheet" href="${rawUrl}" />`;
  }

  return rawUrl;
}

function removeInjectedActions(doc: Document): void {
  doc.querySelectorAll(UNPKG_COPY_CELL_SELECTOR).forEach((element) => {
    element.remove();
  });

  doc.querySelectorAll(UNPKG_COPY_WRAPPER_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function createButton(doc: Document, win: Window, label: string, payload: string): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = ACTION_CONTROL_STYLE;
  button.addEventListener('click', async () => {
    await win.navigator.clipboard.writeText(payload);
  });
  return button;
}

function appendButtons(
  container: HTMLElement,
  doc: Document,
  win: Window,
  target: UnpkgActionTarget,
): void {
  container.append(createButton(doc, win, 'Copy URL', buildCopyText(target.rawUrl)));

  if (target.kind === 'js') {
    container.append(createButton(doc, win, 'Copy <script>', buildCopyText(target.rawUrl, 'script')));
  }

  if (target.kind === 'css') {
    container.append(createButton(doc, win, 'Copy <link>', buildCopyText(target.rawUrl, 'link')));
  }
}

function createWrapper(doc: Document, display: 'inline-flex' | 'flex'): HTMLDivElement {
  const wrapper = doc.createElement('div');
  wrapper.dataset.qhelperUnpkgCopyWrapper = 'true';
  wrapper.style.display = display;
  wrapper.style.flexWrap = 'wrap';
  wrapper.style.gap = '0.5rem';
  wrapper.style.alignItems = 'center';
  return wrapper;
}

function getListingTarget(row: HTMLTableRowElement, baseUrl: string): UnpkgActionTarget | null {
  const fileLink = row.querySelector<HTMLAnchorElement>('td:nth-child(2) a[href]');
  if (!fileLink) {
    return null;
  }

  const rawUrl = normalizeUnpkgAssetUrl(fileLink.href, baseUrl);
  if (new URL(rawUrl).pathname.endsWith('/')) {
    return null;
  }

  return {
    rawUrl,
    kind: detectAssetKind(rawUrl),
  };
}

function findDetailRawLink(doc: Document): HTMLAnchorElement | null {
  return (
    Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]')).find(
      (anchor) => anchor.textContent?.trim() === 'View Raw' && anchor.href.startsWith(`https://${RAW_HOST}/`),
    ) ?? null
  );
}

function findBrowseDetailAnchor(doc: Document, pathname: string): HTMLAnchorElement | null {
  const normalizedPathname = normalizeUnpkgPath(pathname);

  return (
    Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]')).find((anchor) => {
      const href = anchor.getAttribute('href');
      if (!href) {
        return false;
      }

      const resolved = new URL(href, 'https://www.unpkg.com');
      return normalizeUnpkgPath(resolved.pathname) === normalizedPathname;
    }) ?? null
  );
}

function getDetailTarget(
  win: Window,
  doc: Document,
): { anchor: HTMLAnchorElement; target: UnpkgActionTarget } | null {
  const rawLink = findDetailRawLink(doc);
  if (rawLink) {
    const rawUrl = normalizeUnpkgAssetUrl(rawLink.href, win.location.href);
    return {
      anchor: rawLink,
      target: {
        rawUrl,
        kind: detectAssetKind(rawUrl),
      },
    };
  }

  const currentFileAnchor = findBrowseDetailAnchor(doc, win.location.pathname);
  if (!currentFileAnchor) {
    return null;
  }

  const rawUrl = normalizeUnpkgAssetUrl(currentFileAnchor.href, win.location.href);
  return {
    anchor: currentFileAnchor,
    target: {
      rawUrl,
      kind: detectAssetKind(rawUrl),
    },
  };
}

function syncDetailActions(doc: Document, win: Window): boolean {
  const detailTarget = getDetailTarget(win, doc);
  if (!detailTarget) {
    return false;
  }

  const wrapper = createWrapper(doc, 'flex');
  wrapper.style.marginRight = '0.75rem';
  appendButtons(wrapper, doc, win, detailTarget.target);
  detailTarget.anchor.parentElement?.insertBefore(wrapper, detailTarget.anchor);
  return true;
}

function syncListingActions(doc: Document, win: Window): boolean {
  const rows = doc.querySelectorAll<HTMLTableRowElement>(LISTING_ROW_SELECTOR);
  let didInject = false;

  rows.forEach((row) => {
    const target = getListingTarget(row, win.location.href);
    if (!target) {
      return;
    }

    const cell = doc.createElement('td');
    cell.dataset.qhelperUnpkgCopyCell = 'true';
    cell.style.padding = '0.75rem 1rem';
    cell.style.whiteSpace = 'nowrap';

    const wrapper = createWrapper(doc, 'inline-flex');
    appendButtons(wrapper, doc, win, target);
    cell.append(wrapper);
    row.append(cell);
    didInject = true;
  });

  return didInject;
}

export function syncUnpkgCopyActions(win: Window, doc: Document): boolean {
  removeInjectedActions(doc);

  return syncDetailActions(doc, win) || syncListingActions(doc, win);
}

export function installUnpkgCopyActions(win: Window, doc: Document): void {
  syncUnpkgCopyActions(win, doc);
}
