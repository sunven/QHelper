import { describe, expect, it } from 'vitest';
import {
  buildStarHistoryDarkImageUrl,
  buildStarHistoryDetailUrl,
  buildStarHistoryImageUrl,
} from './star-history';

describe('Star History URL builders', () => {
  it('builds the Star History image URL for a repository', () => {
    expect(buildStarHistoryImageUrl({ owner: 'ultraworkers', repo: 'claw-code' })).toBe(
      'https://api.star-history.com/svg?repos=ultraworkers/claw-code&type=Date',
    );
  });

  it('builds the dark-theme Star History image URL for a repository', () => {
    expect(buildStarHistoryDarkImageUrl({ owner: 'ultraworkers', repo: 'claw-code' })).toBe(
      'https://api.star-history.com/svg?repos=ultraworkers/claw-code&type=Date&theme=dark',
    );
  });

  it('builds the Star History detail URL for a repository', () => {
    expect(buildStarHistoryDetailUrl({ owner: 'ultraworkers', repo: 'claw-code' })).toBe(
      'https://star-history.com/#ultraworkers/claw-code&Date',
    );
  });
});
