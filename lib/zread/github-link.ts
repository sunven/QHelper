import { parseRepoCoordinates, type RepoCoordinates } from '@/lib/github/repository';

const ZREAD_GITHUB_LINK_SELECTOR = '[data-qhelper-zread-github-link="true"]';

function buildGitHubUrl({ owner, repo }: RepoCoordinates): string {
  return `https://github.com/${owner}/${repo}`;
}

function getInjectedZreadGitHubLink(doc: Document): HTMLAnchorElement | null {
  return doc.querySelector<HTMLAnchorElement>(ZREAD_GITHUB_LINK_SELECTOR);
}

function findZreadRepositoryControls(
  doc: Document,
  { owner, repo }: RepoCoordinates,
): HTMLElement | null {
  const repositoryName = `${owner}/${repo}`;

  for (const button of doc.querySelectorAll<HTMLButtonElement>('button')) {
    if (button.textContent?.trim() === repositoryName && button.parentElement) {
      return button.parentElement;
    }
  }

  return null;
}

function findZreadGitHubLinkContainer(
  doc: Document,
  repoCoordinates: RepoCoordinates,
): HTMLElement {
  const repositoryControls = findZreadRepositoryControls(doc, repoCoordinates);
  if (repositoryControls) {
    return repositoryControls;
  }

  return doc.querySelector<HTMLElement>('header') ?? doc.body ?? doc.documentElement;
}

export function syncZreadGithubLink(doc: Document, pathname: string): boolean {
  doc.querySelectorAll(ZREAD_GITHUB_LINK_SELECTOR).forEach((element) => {
    element.remove();
  });

  const repoCoordinates = parseRepoCoordinates(pathname);
  if (!repoCoordinates) {
    return false;
  }

  const anchor = doc.createElement('a');
  anchor.href = buildGitHubUrl(repoCoordinates);
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className =
    'hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md p-2 text-base leading-none font-medium select-none';
  anchor.textContent = 'GitHub';
  anchor.title = 'Open GitHub repository';
  anchor.setAttribute('aria-label', 'Open GitHub repository');
  anchor.dataset.qhelperZreadGithubLink = 'true';

  findZreadGitHubLinkContainer(doc, repoCoordinates).append(anchor);

  return true;
}

export function installZreadGithubLink(win: Window, doc: Document): void {
  let lastPathname = win.location.pathname;

  const render = () => {
    lastPathname = win.location.pathname;
    syncZreadGithubLink(doc, win.location.pathname);
  };

  const shouldRenderFromMutation = () => {
    if (win.location.pathname !== lastPathname) {
      return true;
    }

    const repoCoordinates = parseRepoCoordinates(win.location.pathname);
    if (!repoCoordinates) {
      return false;
    }

    const injectedLink = getInjectedZreadGitHubLink(doc);
    return (
      !injectedLink ||
      injectedLink.parentElement !== findZreadGitHubLinkContainer(doc, repoCoordinates)
    );
  };

  render();
  win.addEventListener('popstate', render);

  const observer = new MutationObserver(() => {
    if (shouldRenderFromMutation()) {
      render();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });
}
