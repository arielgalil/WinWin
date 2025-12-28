import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Asset Optimization', () => {
  it('favicon.svg should be less than 2MB', () => {
    const faviconPath = path.resolve(__dirname, '../../public/favicon.svg');
    const stats = fs.statSync(faviconPath);
    const sizeInMB = stats.size / (1024 * 1024);
    expect(sizeInMB).toBeLessThan(2);
  });
});
