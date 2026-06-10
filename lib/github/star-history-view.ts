import {
  getRepositoryCoordinates,
  isRepositoryHomePath,
  type RepoCoordinates,
} from './repository';
import {
  installRepositoryPageHelper,
  type RepositoryPageHelperAdapter,
} from './repository-page-helper';
import {
  STAR_HISTORY_SVG_MESSAGE,
  type StarHistorySvgResponse,
} from './star-history-background';
import {
  buildStarHistoryDarkImageUrl,
  buildStarHistoryDetailUrl,
  buildStarHistoryImageUrl,
} from './star-history';

export const STAR_HISTORY_BUTTON_ID = 'qhelper-star-history-button';
export const STAR_HISTORY_POPOVER_ID = 'qhelper-star-history-popover';
export const STAR_HISTORY_ROOT_SELECTOR = '[data-qhelper-star-history-root="true"]';

const STAR_HISTORY_NAMESPACE = 'qhelper-star-history';
const starHistoryDocumentCleanups = new WeakMap<Document, () => void>();

export {
  buildStarHistoryDarkImageUrl,
  buildStarHistoryDetailUrl,
  buildStarHistoryImageUrl,
};

interface StarHistoryRuntime {
  sendMessage: (
    message: unknown,
    callback: (response: StarHistorySvgResponse | undefined) => void,
  ) => void;
}

interface StarHistoryViewDeps {
  runtime?: StarHistoryRuntime;
}

function removeStarHistoryRoot(doc: Document): void {
  starHistoryDocumentCleanups.get(doc)?.();
  starHistoryDocumentCleanups.delete(doc);

  doc.querySelectorAll(STAR_HISTORY_ROOT_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function createStyleElement(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = `
    .${STAR_HISTORY_NAMESPACE} {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .${STAR_HISTORY_NAMESPACE}__button {
      display: inline-flex;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(31, 35, 40, 0.16);
      border-radius: 50%;
      background: #ffffff;
      color: #24292f;
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
      cursor: pointer;
      transition: background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }

    .${STAR_HISTORY_NAMESPACE}__button:hover {
      background: #f6f8fa;
      box-shadow: 0 12px 28px rgba(140, 149, 159, 0.26);
      transform: translateY(-1px);
    }

    .${STAR_HISTORY_NAMESPACE}__button:focus-visible {
      outline: 2px solid #0969da;
      outline-offset: 2px;
    }

    .${STAR_HISTORY_NAMESPACE}__button svg {
      width: 22px;
      height: 22px;
    }

    .${STAR_HISTORY_NAMESPACE}__popover {
      position: absolute;
      right: 0;
      bottom: 56px;
      width: min(600px, calc(100vw - 32px));
      overflow: hidden;
      border: 1px solid rgba(31, 35, 40, 0.16);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 16px 48px rgba(31, 35, 40, 0.18);
    }

    .${STAR_HISTORY_NAMESPACE}__header {
      display: flex;
      min-width: 0;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid rgba(31, 35, 40, 0.12);
      padding: 10px 12px;
    }

    .${STAR_HISTORY_NAMESPACE}__title-row {
      display: inline-flex;
      min-width: 0;
      flex: 1 1 auto;
      align-items: center;
      gap: 6px;
    }

    .${STAR_HISTORY_NAMESPACE}__title {
      min-width: 0;
      overflow: hidden;
      flex: 0 1 auto;
      color: #24292f;
      font-size: 13px;
      font-weight: 600;
      line-height: 18px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .${STAR_HISTORY_NAMESPACE}__actions {
      display: inline-flex;
      flex: none;
      align-items: center;
    }

    .${STAR_HISTORY_NAMESPACE}__external,
    .${STAR_HISTORY_NAMESPACE}__close {
      display: inline-flex;
      width: 26px;
      height: 26px;
      flex: none;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #57606a;
      cursor: pointer;
      text-decoration: none;
    }

    .${STAR_HISTORY_NAMESPACE}__external:hover,
    .${STAR_HISTORY_NAMESPACE}__close:hover {
      background: #f6f8fa;
      color: #24292f;
    }

    .${STAR_HISTORY_NAMESPACE}__external:focus-visible,
    .${STAR_HISTORY_NAMESPACE}__close:focus-visible {
      outline: 2px solid #0969da;
      outline-offset: 2px;
    }

    .${STAR_HISTORY_NAMESPACE}__external svg {
      width: 16px;
      height: 16px;
    }

    .${STAR_HISTORY_NAMESPACE}__body {
      padding: 12px;
    }

    .${STAR_HISTORY_NAMESPACE}__link {
      display: block;
      aspect-ratio: 600 / 400;
    }

    .${STAR_HISTORY_NAMESPACE}__image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .${STAR_HISTORY_NAMESPACE}__loading,
    .${STAR_HISTORY_NAMESPACE}__error {
      display: flex;
      aspect-ratio: 600 / 400;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 1px dashed rgba(31, 35, 40, 0.18);
      border-radius: 6px;
      padding: 24px;
      color: #57606a;
      text-align: center;
    }

    .${STAR_HISTORY_NAMESPACE}__loading {
      border: 1px solid rgba(31, 35, 40, 0.12);
      border-radius: 6px;
    }

    .${STAR_HISTORY_NAMESPACE}__spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(87, 96, 106, 0.24);
      border-top-color: #0969da;
      border-radius: 50%;
      animation: ${STAR_HISTORY_NAMESPACE}-spin 0.8s linear infinite;
    }

    .${STAR_HISTORY_NAMESPACE}__loading-text {
      font-size: 13px;
      line-height: 18px;
    }

    @keyframes ${STAR_HISTORY_NAMESPACE}-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .${STAR_HISTORY_NAMESPACE}__error-text {
      margin: 0;
      font-size: 13px;
      line-height: 18px;
    }

    .${STAR_HISTORY_NAMESPACE}__error-link {
      display: inline-flex;
      min-height: 32px;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(31, 35, 40, 0.16);
      border-radius: 6px;
      padding: 0 12px;
      background: #f6f8fa;
      color: #0969da;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }

    @media (prefers-color-scheme: dark) {
      .${STAR_HISTORY_NAMESPACE}__button,
      .${STAR_HISTORY_NAMESPACE}__popover {
        border-color: rgba(240, 246, 252, 0.16);
        background: #0d1117;
        color: #e6edf3;
      }

      .${STAR_HISTORY_NAMESPACE}__button:hover,
      .${STAR_HISTORY_NAMESPACE}__external:hover,
      .${STAR_HISTORY_NAMESPACE}__close:hover {
        background: #161b22;
      }

      .${STAR_HISTORY_NAMESPACE}__header {
        border-bottom-color: rgba(240, 246, 252, 0.12);
      }

      .${STAR_HISTORY_NAMESPACE}__title {
        color: #e6edf3;
      }

      .${STAR_HISTORY_NAMESPACE}__external,
      .${STAR_HISTORY_NAMESPACE}__close,
      .${STAR_HISTORY_NAMESPACE}__loading,
      .${STAR_HISTORY_NAMESPACE}__error {
        color: #8b949e;
      }

      .${STAR_HISTORY_NAMESPACE}__loading {
        border-color: rgba(240, 246, 252, 0.12);
      }

      .${STAR_HISTORY_NAMESPACE}__spinner {
        border-color: rgba(139, 148, 158, 0.28);
        border-top-color: #58a6ff;
      }

      .${STAR_HISTORY_NAMESPACE}__error {
        border-color: rgba(240, 246, 252, 0.18);
      }

      .${STAR_HISTORY_NAMESPACE}__error-link {
        border-color: rgba(240, 246, 252, 0.16);
        background: #161b22;
        color: #58a6ff;
      }
    }

    @media (max-width: 640px) {
      .${STAR_HISTORY_NAMESPACE} {
        right: 16px;
        bottom: 16px;
      }

      .${STAR_HISTORY_NAMESPACE}__popover {
        bottom: 54px;
      }
    }
  `;

  return style;
}

function createIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const star = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  star.setAttribute(
    'd',
    'M11.5 2.8 14.3 8.5l6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9 2.8-5.7Z',
  );

  const trend = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  trend.setAttribute('d', 'M7 14.5 10 12l2.2 2 4.8-5');

  svg.append(star, trend);
  return svg;
}

function createExternalLinkIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const box = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  box.setAttribute('d', 'M15 3h6v6');

  const arrow = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M10 14 21 3');

  const frame = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  frame.setAttribute('d', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6');

  svg.append(box, arrow, frame);
  return svg;
}

function createErrorState(doc: Document, detailUrl: string): HTMLDivElement {
  const error = doc.createElement('div');
  error.className = `${STAR_HISTORY_NAMESPACE}__error`;

  const message = doc.createElement('p');
  message.className = `${STAR_HISTORY_NAMESPACE}__error-text`;
  message.textContent = 'Star history chart could not be loaded.';

  const link = doc.createElement('a');
  link.className = `${STAR_HISTORY_NAMESPACE}__error-link`;
  link.href = detailUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open Star History';

  error.append(message, link);
  return error;
}

function createLoadingState(doc: Document): HTMLDivElement {
  const loading = doc.createElement('div');
  loading.className = `${STAR_HISTORY_NAMESPACE}__loading`;

  const spinner = doc.createElement('div');
  spinner.className = `${STAR_HISTORY_NAMESPACE}__spinner`;
  spinner.setAttribute('aria-hidden', 'true');

  const text = doc.createElement('div');
  text.className = `${STAR_HISTORY_NAMESPACE}__loading-text`;
  text.textContent = 'Loading Star History...';

  loading.append(spinner, text);
  return loading;
}

function encodeSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function requestStarHistorySvg(
  runtime: StarHistoryRuntime,
  repo: RepoCoordinates,
  theme: 'light' | 'dark',
): Promise<string> {
  return new Promise((resolve, reject) => {
    runtime.sendMessage(
      {
        type: STAR_HISTORY_SVG_MESSAGE,
        repo,
        theme,
      },
      (response: StarHistorySvgResponse | undefined) => {
        if (response?.ok && response.svg) {
          resolve(response.svg);
          return;
        }

        reject(new Error(response?.error ?? 'Failed to load Star History'));
      },
    );
  });
}

async function loadStarHistoryChart(
  body: HTMLDivElement,
  doc: Document,
  repoCoordinates: RepoCoordinates,
  detailUrl: string,
  runtime: StarHistoryRuntime,
): Promise<void> {
  const [lightSvg, darkSvg] = await Promise.all([
    requestStarHistorySvg(runtime, repoCoordinates, 'light'),
    requestStarHistorySvg(runtime, repoCoordinates, 'dark'),
  ]);
  const imageUrl = encodeSvgDataUrl(lightSvg);
  const darkImageUrl = encodeSvgDataUrl(darkSvg);

  const link = doc.createElement('a');
  link.className = `${STAR_HISTORY_NAMESPACE}__link`;
  link.href = detailUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const picture = doc.createElement('picture');

  const darkSource = doc.createElement('source');
  darkSource.media = '(prefers-color-scheme: dark)';
  darkSource.srcset = darkImageUrl;

  const lightSource = doc.createElement('source');
  lightSource.media = '(prefers-color-scheme: light)';
  lightSource.srcset = imageUrl;

  const image = doc.createElement('img');
  image.className = `${STAR_HISTORY_NAMESPACE}__image`;
  image.alt = `Star history for ${repoCoordinates.owner}/${repoCoordinates.repo}`;
  image.src = imageUrl;
  image.width = 600;
  image.loading = 'lazy';
  image.decoding = 'async';

  image.addEventListener(
    'error',
    () => {
      body.replaceChildren(createErrorState(doc, detailUrl));
    },
    { once: true },
  );

  picture.append(darkSource, lightSource, image);
  link.append(picture);
  body.replaceChildren(link);
}

function createPopover(
  doc: Document,
  repoCoordinates: RepoCoordinates,
  onClose: () => void,
  runtime: StarHistoryRuntime | undefined,
): HTMLDivElement {
  const detailUrl = buildStarHistoryDetailUrl(repoCoordinates);
  const popover = doc.createElement('div');
  popover.id = STAR_HISTORY_POPOVER_ID;
  popover.className = `${STAR_HISTORY_NAMESPACE}__popover`;
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', `Star history for ${repoCoordinates.owner}/${repoCoordinates.repo}`);

  const header = doc.createElement('div');
  header.className = `${STAR_HISTORY_NAMESPACE}__header`;

  const title = doc.createElement('div');
  title.className = `${STAR_HISTORY_NAMESPACE}__title`;
  title.textContent = `Star history for ${repoCoordinates.owner}/${repoCoordinates.repo}`;

  const titleRow = doc.createElement('div');
  titleRow.className = `${STAR_HISTORY_NAMESPACE}__title-row`;

  const externalLink = doc.createElement('a');
  externalLink.className = `${STAR_HISTORY_NAMESPACE}__external`;
  externalLink.href = detailUrl;
  externalLink.target = '_blank';
  externalLink.rel = 'noopener noreferrer';
  externalLink.title = 'Open Star History';
  externalLink.setAttribute('aria-label', 'Open Star History');
  externalLink.append(createExternalLinkIcon(doc));

  const actions = doc.createElement('div');
  actions.className = `${STAR_HISTORY_NAMESPACE}__actions`;

  const closeButton = doc.createElement('button');
  closeButton.type = 'button';
  closeButton.className = `${STAR_HISTORY_NAMESPACE}__close`;
  closeButton.setAttribute('aria-label', 'Close Star History');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', onClose);

  titleRow.append(title, externalLink);
  actions.append(closeButton);
  header.append(titleRow, actions);

  const body = doc.createElement('div');
  body.className = `${STAR_HISTORY_NAMESPACE}__body`;
  body.append(createLoadingState(doc));

  if (!runtime) {
    body.replaceChildren(createErrorState(doc, detailUrl));
  } else {
    void loadStarHistoryChart(body, doc, repoCoordinates, detailUrl, runtime).catch(() => {
      body.replaceChildren(createErrorState(doc, detailUrl));
    });
  }

  popover.append(header, body);
  return popover;
}

function createStarHistoryRoot(
  doc: Document,
  repoCoordinates: RepoCoordinates,
  runtime: StarHistoryRuntime | undefined,
): HTMLDivElement {
  const root = doc.createElement('div');
  const controller = new AbortController();
  root.dataset.qhelperStarHistoryRoot = 'true';
  root.className = STAR_HISTORY_NAMESPACE;

  const button = doc.createElement('button');
  button.id = STAR_HISTORY_BUTTON_ID;
  button.type = 'button';
  button.className = `${STAR_HISTORY_NAMESPACE}__button`;
  button.title = 'Star History';
  button.setAttribute('aria-label', 'Open Star History');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', STAR_HISTORY_POPOVER_ID);
  button.append(createIcon(doc));

  const closePopover = () => {
    root.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)?.remove();
    button.setAttribute('aria-expanded', 'false');
  };

  const openPopover = () => {
    if (root.querySelector(`#${STAR_HISTORY_POPOVER_ID}`)) {
      closePopover();
      return;
    }

    root.append(createPopover(doc, repoCoordinates, closePopover, runtime));
    button.setAttribute('aria-expanded', 'true');
  };

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    openPopover();
  });

  root.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  doc.addEventListener('click', closePopover, { signal: controller.signal });
  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        closePopover();
      }
    },
    { signal: controller.signal },
  );

  root.append(createStyleElement(doc), button);
  starHistoryDocumentCleanups.set(doc, () => controller.abort());
  return root;
}

export function syncStarHistoryView(
  doc: Document,
  pathname: string,
  deps: StarHistoryViewDeps = {},
): boolean {
  removeStarHistoryRoot(doc);

  const repoCoordinates = getRepositoryCoordinates(doc, pathname);
  if (!repoCoordinates || !isRepositoryHomePath(pathname)) {
    return false;
  }

  doc.body.append(createStarHistoryRoot(doc, repoCoordinates, deps.runtime ?? chrome.runtime));
  return true;
}

export function installGitHubStarHistoryView(
  win: Window,
  doc: Document,
  deps: StarHistoryViewDeps = {},
): void {
  installRepositoryPageHelper(
    win,
    doc,
    createGitHubStarHistoryViewHelper(doc, deps),
  );
}

export function createGitHubStarHistoryViewHelper(
  doc: Document,
  deps: StarHistoryViewDeps = {},
): RepositoryPageHelperAdapter {
  return {
    render: (pathname) => syncStarHistoryView(doc, pathname, deps),
    shouldRetry: (pathname) =>
      getRepositoryCoordinates(doc, pathname) !== null && isRepositoryHomePath(pathname),
    shouldRecoverFromMutation: (pathname) =>
      getRepositoryCoordinates(doc, pathname) !== null &&
      isRepositoryHomePath(pathname) &&
      !doc.querySelector(STAR_HISTORY_ROOT_SELECTOR),
  };
}
