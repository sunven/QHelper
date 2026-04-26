const ZREAD_BUTTON_SELECTOR = '[data-qhelper-zread-wrapper="true"]';
const LEGACY_VSCODE_URL_PREFIX = 'https://vscode.dev/github/';
const REPOSITORY_NWO_META_SELECTOR = 'meta[name="octolytics-dimension-repository_nwo"]';
const LEGACY_VSCODE_HEADER_SELECTORS = [
  '#repository-details-container',
  '#repository-container-header',
  '.Header-item.mr-0.mr-md-3.flex-order-1.flex-md-order-none',
];

function parseRepoCoordinates(pathname) {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/+$/, '');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }

  return {
    owner: segments[0],
    repo: segments[1],
  };
}

function buildZreadUrl(repoCoordinates) {
  return `https://zread.ai/${repoCoordinates.owner}/${repoCoordinates.repo}`;
}

function hasRepositoryMetadata(repoCoordinates) {
  const repositoryNwo = document.querySelector(REPOSITORY_NWO_META_SELECTOR)?.content;
  return repositoryNwo === `${repoCoordinates.owner}/${repoCoordinates.repo}`;
}

function getRepositoryCoordinates(pathname) {
  const repoCoordinates = parseRepoCoordinates(pathname);
  if (!repoCoordinates || !hasRepositoryMetadata(repoCoordinates)) {
    return null;
  }

  return repoCoordinates;
}

function isLegacyVscodeButton(anchor) {
  return (
    anchor.classList.contains('btn') &&
    anchor.textContent?.trim() === 'vscode.dev' &&
    anchor.href.startsWith(LEGACY_VSCODE_URL_PREFIX)
  );
}

function isInLegacyHeaderPlacement(anchor) {
  return LEGACY_VSCODE_HEADER_SELECTORS.some((selector) => anchor.closest(selector) !== null);
}

function removeLegacyButtons() {
  document.querySelectorAll(`a[href^="${LEGACY_VSCODE_URL_PREFIX}"]`).forEach((anchor) => {
    if (!isLegacyVscodeButton(anchor)) {
      return;
    }

    const listItem = anchor.closest('li');
    if (listItem && listItem.parentElement && listItem.parentElement.matches('.pagehead-actions')) {
      listItem.remove();
      return;
    }

    if (isInLegacyHeaderPlacement(anchor)) {
      anchor.remove();
    }
  });
}

function removeInjectedButton() {
  document.querySelectorAll(ZREAD_BUTTON_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function findActionList() {
  return (
    document.querySelector('#repository-details-container .pagehead-actions') ||
    document.querySelector('#repository-container-header .pagehead-actions') ||
    document.querySelector('.pagehead-actions')
  );
}

function findHeaderFallback() {
  return (
    document.querySelector('#repository-details-container') ||
    document.querySelector('#repository-container-header') ||
    document.querySelector('main [itemprop="name"]')
  );
}

function createAnchor(target) {
  const anchor = document.createElement('a');
  anchor.href = target;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = 'btn-sm btn';
  anchor.textContent = '在 Zread';
  return anchor;
}

function syncZreadButton() {
  removeLegacyButtons();
  removeInjectedButton();

  const repoCoordinates = getRepositoryCoordinates(window.location.pathname);
  if (!repoCoordinates) {
    return false;
  }

  const target = buildZreadUrl(repoCoordinates);
  const actionList = findActionList();
  if (actionList) {
    const listItem = document.createElement('li');
    listItem.dataset.qhelperZreadWrapper = 'true';
    listItem.append(createAnchor(target));
    actionList.insertBefore(listItem, actionList.firstElementChild);
    return true;
  }

  const headerFallback = findHeaderFallback();
  if (headerFallback) {
    const wrapper = document.createElement('div');
    wrapper.dataset.qhelperZreadWrapper = 'true';
    wrapper.className = 'mt-2';
    wrapper.append(createAnchor(target));
    headerFallback.append(wrapper);
    return true;
  }

  return false;
}

function installZreadButton() {
  let lastPathname = window.location.pathname;
  let retryTimer;

  const attemptRender = () => {
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    const rendered = syncZreadButton();
    if (!rendered && getRepositoryCoordinates(window.location.pathname)) {
      retryTimer = window.setTimeout(attemptRender, 250);
    }
  };

  const rerenderIfPathChanged = () => {
    if (window.location.pathname === lastPathname) {
      return;
    }

    lastPathname = window.location.pathname;
    attemptRender();
  };

  attemptRender();
  document.addEventListener('turbo:load', rerenderIfPathChanged);
  document.addEventListener('pjax:end', rerenderIfPathChanged);
  window.addEventListener('popstate', rerenderIfPathChanged);

  const observer = new MutationObserver(() => {
    rerenderIfPathChanged();

    if (
      getRepositoryCoordinates(window.location.pathname) &&
      !document.querySelector(ZREAD_BUTTON_SELECTOR)
    ) {
      attemptRender();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

installZreadButton();
