import type { RepoCoordinates } from './repository';
import {
  buildStarHistoryDarkImageUrl,
  buildStarHistoryImageUrl,
  type StarHistoryTheme,
} from './star-history';

export const STAR_HISTORY_SVG_MESSAGE = 'QHELPER_STAR_HISTORY_SVG';

export interface StarHistorySvgMessage {
  type: typeof STAR_HISTORY_SVG_MESSAGE;
  repo: RepoCoordinates;
  theme: StarHistoryTheme;
}

export interface StarHistorySvgResponse {
  ok: boolean;
  svg?: string;
  error?: string;
}

export type StarHistoryBackgroundDeps = {
  fetchText: (url: string) => Promise<string>;
};

const defaultDeps: StarHistoryBackgroundDeps = {
  fetchText: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Star History returned ${response.status}`);
    }

    return response.text();
  },
};

function isRepoCoordinates(value: unknown): value is RepoCoordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RepoCoordinates).owner === 'string' &&
    typeof (value as RepoCoordinates).repo === 'string'
  );
}

export function isStarHistorySvgMessage(message: unknown): message is StarHistorySvgMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as StarHistorySvgMessage).type === STAR_HISTORY_SVG_MESSAGE &&
    isRepoCoordinates((message as StarHistorySvgMessage).repo) &&
    ((message as StarHistorySvgMessage).theme === 'light' ||
      (message as StarHistorySvgMessage).theme === 'dark')
  );
}

function getStarHistoryUrl({ repo, theme }: StarHistorySvgMessage): string {
  return theme === 'dark' ? buildStarHistoryDarkImageUrl(repo) : buildStarHistoryImageUrl(repo);
}

export function handleStarHistorySvgMessage(
  message: unknown,
  sendResponse: (value: StarHistorySvgResponse) => void,
  deps: StarHistoryBackgroundDeps = defaultDeps,
) {
  if (!isStarHistorySvgMessage(message)) {
    return false;
  }

  void deps
    .fetchText(getStarHistoryUrl(message))
    .then((svg) => {
      sendResponse({ ok: true, svg });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load Star History',
      });
    });

  return true;
}
