import type { RepoCoordinates } from './repository';

const STAR_HISTORY_API_BASE_URL = 'https://api.star-history.com/svg';
const STAR_HISTORY_DETAIL_BASE_URL = 'https://star-history.com/';

export type StarHistoryTheme = 'light' | 'dark';

export function buildStarHistoryImageUrl(
  { owner, repo }: RepoCoordinates,
  theme: StarHistoryTheme = 'light',
): string {
  const themeParam = theme === 'dark' ? '&theme=dark' : '';
  return `${STAR_HISTORY_API_BASE_URL}?repos=${owner}/${repo}&type=Date${themeParam}`;
}

export function buildStarHistoryDarkImageUrl(repoCoordinates: RepoCoordinates): string {
  return buildStarHistoryImageUrl(repoCoordinates, 'dark');
}

export function buildStarHistoryDetailUrl({ owner, repo }: RepoCoordinates): string {
  return `${STAR_HISTORY_DETAIL_BASE_URL}#${owner}/${repo}&Date`;
}
