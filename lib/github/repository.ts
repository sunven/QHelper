const REPOSITORY_NWO_META_SELECTOR = 'meta[name="octolytics-dimension-repository_nwo"]';

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
