import { describe, expect, it } from 'vitest';
import {
  getRepositoryCoordinates,
  hasRepositoryMetadata,
  isRepositoryHomePath,
  parseRepoCoordinates,
} from './repository';

function renderRepositoryMeta(owner = 'Yeachan-Heo', repo = 'oh-my-codex'): void {
  document.head.innerHTML = `
    <meta
      name="octolytics-dimension-repository_nwo"
      content="${owner}/${repo}"
    />
  `;
}

describe('parseRepoCoordinates', () => {
  it('parses repository root paths', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
  });

  it('parses repository subpage paths from the first two segments', () => {
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/issues')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(parseRepoCoordinates('/Yeachan-Heo/oh-my-codex/blob/main/README.md')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
  });

  it('rejects GitHub root paths', () => {
    expect(parseRepoCoordinates('/')).toBeNull();
    expect(parseRepoCoordinates('/Yeachan-Heo')).toBeNull();
  });
});

describe('isRepositoryHomePath', () => {
  it('accepts repository home paths', () => {
    expect(isRepositoryHomePath('/Yeachan-Heo/oh-my-codex')).toBe(true);
    expect(isRepositoryHomePath('/Yeachan-Heo/oh-my-codex/')).toBe(true);
  });

  it('rejects repository subpage paths and non-repository roots', () => {
    expect(isRepositoryHomePath('/Yeachan-Heo/oh-my-codex/issues')).toBe(false);
    expect(isRepositoryHomePath('/Yeachan-Heo/oh-my-codex/blob/main/README.md')).toBe(false);
    expect(isRepositoryHomePath('/')).toBe(false);
    expect(isRepositoryHomePath('/Yeachan-Heo')).toBe(false);
  });
});

describe('repository metadata', () => {
  it('validates repository metadata against parsed coordinates', () => {
    renderRepositoryMeta();

    expect(hasRepositoryMetadata(document, { owner: 'Yeachan-Heo', repo: 'oh-my-codex' })).toBe(
      true,
    );
    expect(hasRepositoryMetadata(document, { owner: 'Yeachan-Heo', repo: 'different-repo' })).toBe(
      false,
    );
  });

  it('returns coordinates only when path and metadata agree', () => {
    renderRepositoryMeta();

    expect(getRepositoryCoordinates(document, '/Yeachan-Heo/oh-my-codex')).toEqual({
      owner: 'Yeachan-Heo',
      repo: 'oh-my-codex',
    });
    expect(getRepositoryCoordinates(document, '/Yeachan-Heo/different-repo')).toBeNull();
  });
});
