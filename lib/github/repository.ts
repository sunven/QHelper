const REPOSITORY_NWO_META_SELECTOR = 'meta[name="octolytics-dimension-repository_nwo"]';
const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);
const RESERVED_GITHUB_OWNERS = new Set([
  'about',
  'account',
  'accounts',
  'admin',
  'advisories',
  'app',
  'apps',
  'billing',
  'blog',
  'business',
  'codespaces',
  'collections',
  'comment',
  'comments',
  'contact',
  'copilot',
  'customer-stories',
  'dashboard',
  'developer',
  'discussions',
  'docs',
  'education',
  'enterprise',
  'events',
  'explore',
  'features',
  'files',
  'funding',
  'gist',
  'git-guides',
  'github',
  'github-copilot',
  'home',
  'issues',
  'join',
  'login',
  'logout',
  'marketplace',
  'mcp',
  'models',
  'new',
  'news',
  'nonprofit',
  'notifications',
  'oauth',
  'open-source',
  'organizations',
  'orgs',
  'payments',
  'personal',
  'plans',
  'premium-support',
  'pricing',
  'pull',
  'pulls',
  'readme',
  'releases',
  'resources',
  'search',
  'security',
  'sessions',
  'settings',
  'shop',
  'showcases',
  'signup',
  'site',
  'sitemap',
  'solutions',
  'sponsors',
  'stars',
  'status',
  'store',
  'stories',
  'support',
  'team',
  'topics',
  'trending',
  'users',
  'watching',
  'why-github',
]);

export interface RepoCoordinates {
  owner: string;
  repo: string;
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

export function parseRepoCoordinates(pathname: string): RepoCoordinates | null {
  const segments = normalizePathname(pathname).split('/').filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const [owner, repo] = segments;
  return { owner, repo };
}

function tryParseUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function parseRepositoryUrl(href: string): RepoCoordinates | null {
  const url = tryParseUrl(href);
  if (!url || !GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const repoCoordinates = parseRepoCoordinates(url.pathname);
  if (!repoCoordinates) {
    return null;
  }

  const owner = repoCoordinates.owner.toLowerCase();
  if (RESERVED_GITHUB_OWNERS.has(owner)) {
    return null;
  }

  const repo = repoCoordinates.repo.replace(/\.git$/i, '');
  if (!repo) {
    return null;
  }

  return { owner: repoCoordinates.owner, repo };
}

export function isRepositoryHomePath(pathname: string): boolean {
  return normalizePathname(pathname).split('/').filter(Boolean).length === 2;
}

export function hasRepositoryMetadata(doc: Document, { owner, repo }: RepoCoordinates): boolean {
  return (
    doc.querySelector<HTMLMetaElement>(REPOSITORY_NWO_META_SELECTOR)?.content ===
    `${owner}/${repo}`
  );
}

export function getRepositoryCoordinates(
  doc: Document,
  pathname: string,
): RepoCoordinates | null {
  const repoCoordinates = parseRepoCoordinates(pathname);
  if (!repoCoordinates || !hasRepositoryMetadata(doc, repoCoordinates)) {
    return null;
  }

  return repoCoordinates;
}
