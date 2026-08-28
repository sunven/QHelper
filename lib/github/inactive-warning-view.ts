import {
  getRepositoryCoordinates,
  isRepositoryHomePath,
  type RepoCoordinates,
} from './repository'
import {
  installRepositoryPageHelper,
  type RepositoryPageHelperAdapter,
} from './repository-page-helper'
import {
  INACTIVE_WARNING_MESSAGE,
  type InactiveWarningResponse,
} from './inactive-warning-background'

export const INACTIVE_WARNING_TIMESTAMP_CLASS =
  'qhelper-inactive-warning__timestamp'

const INACTIVE_WARNING_STYLE_ID = 'qhelper-inactive-warning-style'
const INACTIVE_WARNING_PULSE_NAME = 'qhelper-inactive-warning-pulse'

interface InactiveWarningRuntime {
  sendMessage: (
    message: unknown,
    callback: (response: InactiveWarningResponse | undefined) => void,
  ) => void
}

interface InactiveWarningViewDeps {
  runtime?: InactiveWarningRuntime
}

interface InactiveWarningJudgement {
  repo: RepoCoordinates
  inactive: boolean
  lastCommitDate?: string
}

const warningJudgements = new WeakMap<Document, InactiveWarningJudgement>()
const inflightWarningKeys = new WeakMap<Document, string | undefined>()

function isSameRepo(a: RepoCoordinates, b: RepoCoordinates): boolean {
  return a.owner === b.owner && a.repo === b.repo
}

function repoKey({ owner, repo }: RepoCoordinates): string {
  return `${owner}/${repo}`
}

function ensureStyleElement(doc: Document): void {
  if (doc.getElementById(INACTIVE_WARNING_STYLE_ID)) {
    return
  }

  const style = doc.createElement('style')
  style.id = INACTIVE_WARNING_STYLE_ID
  style.textContent = `
    relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS} {
      color: #bc4c00;
      font-weight: 600;
      animation: ${INACTIVE_WARNING_PULSE_NAME} 2s ease-in-out infinite;
    }

    relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}::part(root) {
      color: #bc4c00;
      font-weight: 600;
    }

    @keyframes ${INACTIVE_WARNING_PULSE_NAME} {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.4;
      }
    }

    @media (prefers-color-scheme: dark) {
      relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS} {
        color: #f0883e;
      }

      relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}::part(root) {
        color: #f0883e;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS} {
        animation: none;
      }
    }
  `
  doc.head.append(style)
}

function clearHighlights(doc: Document): void {
  doc
    .querySelectorAll(`relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`)
    .forEach((element) => {
      element.classList.remove(INACTIVE_WARNING_TIMESTAMP_CLASS)
    })
}

function highlightLastCommitTime(doc: Document, lastCommitDate: Date): void {
  const timestamp = lastCommitDate.getTime()

  // File rows touched by the head commit share its datetime, so target the
  // latest-commit row explicitly instead of matching timestamps page-wide.
  // "latest-commit" is the message box; the hash and timestamp live in
  // "latest-commit-details".
  const element = doc.querySelector(
    '[data-testid="latest-commit-details"] relative-time',
  )
  const datetime = element?.getAttribute('datetime')
  if (element !== null && datetime !== null && datetime !== undefined) {
    if (Date.parse(datetime) === timestamp) {
      element.classList.add(INACTIVE_WARNING_TIMESTAMP_CLASS)
    }
  }
}

function applyInactiveHighlight(doc: Document, lastCommitDate: string): void {
  ensureStyleElement(doc)
  highlightLastCommitTime(doc, new Date(lastCommitDate))
}

function hasHighlight(doc: Document): boolean {
  return (
    doc.querySelector(`relative-time.${INACTIVE_WARNING_TIMESTAMP_CLASS}`) !==
    null
  )
}

function requestInactiveWarning(
  doc: Document,
  repo: RepoCoordinates,
  deps: InactiveWarningViewDeps,
): void {
  const key = repoKey(repo)
  if (inflightWarningKeys.get(doc) === key) {
    return
  }
  inflightWarningKeys.set(doc, key)

  const runtime = deps.runtime ?? chrome.runtime
  runtime.sendMessage(
    {
      type: INACTIVE_WARNING_MESSAGE,
      repo,
    },
    (response) => {
      if (inflightWarningKeys.get(doc) === key) {
        inflightWarningKeys.delete(doc)
      }

      if (!response?.ok) {
        return
      }

      warningJudgements.set(doc, {
        repo,
        inactive: response.inactive === true,
        lastCommitDate: response.lastCommitDate,
      })

      if (response.inactive !== true || response.lastCommitDate === undefined) {
        return
      }

      const pathname = doc.location.pathname
      const currentRepo = getRepositoryCoordinates(doc, pathname)
      if (
        !currentRepo ||
        !isRepositoryHomePath(pathname) ||
        !isSameRepo(currentRepo, repo)
      ) {
        return
      }

      applyInactiveHighlight(doc, response.lastCommitDate)
    },
  )
}

export function syncInactiveWarningView(
  doc: Document,
  pathname: string,
  deps: InactiveWarningViewDeps = {},
): boolean {
  clearHighlights(doc)

  const repoCoordinates = getRepositoryCoordinates(doc, pathname)
  if (!repoCoordinates || !isRepositoryHomePath(pathname)) {
    return false
  }

  const known = warningJudgements.get(doc)
  if (known && isSameRepo(known.repo, repoCoordinates)) {
    if (known.inactive && known.lastCommitDate !== undefined) {
      applyInactiveHighlight(doc, known.lastCommitDate)
    }
    return true
  }

  requestInactiveWarning(doc, repoCoordinates, deps)
  return true
}

export function installGitHubInactiveWarningView(
  win: Window,
  doc: Document,
  deps: InactiveWarningViewDeps = {},
): void {
  installRepositoryPageHelper(
    win,
    doc,
    createGitHubInactiveWarningHelper(doc, deps),
  )
}

export function createGitHubInactiveWarningHelper(
  doc: Document,
  deps: InactiveWarningViewDeps = {},
): RepositoryPageHelperAdapter {
  return {
    render: (pathname) => syncInactiveWarningView(doc, pathname, deps),
    shouldRetry: (pathname) =>
      getRepositoryCoordinates(doc, pathname) !== null &&
      isRepositoryHomePath(pathname),
    shouldRecoverFromMutation: (pathname) => {
      const repoCoordinates = getRepositoryCoordinates(doc, pathname)
      if (!repoCoordinates || !isRepositoryHomePath(pathname)) {
        return false
      }

      if (hasHighlight(doc)) {
        return false
      }

      const known = warningJudgements.get(doc)
      return (
        known !== undefined &&
        isSameRepo(known.repo, repoCoordinates) &&
        known.inactive &&
        known.lastCommitDate !== undefined
      )
    },
  }
}
