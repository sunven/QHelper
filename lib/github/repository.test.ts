import { describe, expect, it } from 'vitest';
import {
  getRepositoryCoordinates,
  hasRepositoryMetadata,
  isRepositoryHomePath,
  parseRepoCoordinates,
  parseRepositoryUrl,
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

describe('parseRepositoryUrl', () => {
  it('parses repository root and subpath URLs', () => {
    expect(parseRepositoryUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
    expect(
      parseRepositoryUrl(
        'https://www.github.com/facebook/react/blob/main/packages/react/src/ReactHooks.js',
      ),
    ).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
    expect(
      parseRepositoryUrl('https://github.com/facebook/react/issues/123?tab=comments'),
    ).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('rejects reserved GitHub paths, Gists, Pages, and non-GitHub hosts', () => {
    expect(parseRepositoryUrl('https://github.com/topics/react')).toBeNull();
    expect(parseRepositoryUrl('https://github.com/orgs/facebook')).toBeNull();
    expect(parseRepositoryUrl('https://github.com/search?q=react')).toBeNull();
    expect(parseRepositoryUrl('https://gist.github.com/octocat/abc')).toBeNull();
    expect(parseRepositoryUrl('https://facebook.github.io/react')).toBeNull();
    expect(parseRepositoryUrl('https://react.dev/')).toBeNull();
    expect(parseRepositoryUrl('not a url')).toBeNull();
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
