import type { RepoCoordinates } from './repository'

export const INACTIVE_WARNING_THRESHOLD_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000
const GITHUB_API_BASE_URL = 'https://api.github.com'

export function buildRepositoryMetaUrl({
  owner,
  repo,
}: RepoCoordinates): string {
  return `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`
}

export function buildDefaultBranchCommitsUrl({
  owner,
  repo,
}: RepoCoordinates): string {
  return `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits?per_page=1`
}

export function isInactiveRepository(
  lastCommitDate: Date,
  now: Date,
  thresholdDays: number = INACTIVE_WARNING_THRESHOLD_DAYS,
): boolean {
  return now.getTime() - lastCommitDate.getTime() > thresholdDays * DAY_MS
}
