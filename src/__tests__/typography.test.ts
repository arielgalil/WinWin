import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

describe('Typography CSS Variables', () => {
  it('should have the new 5-level typography variables defined in index.css', () => {
    const cssPath = resolve(__dirname, '../index.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('--fs-h1');
    expect(cssContent).toContain('--fs-h2');
    expect(cssContent).toContain('--fs-h3');
    expect(cssContent).toContain('--fs-body');
    expect(cssContent).toContain('--fs-small');
  });

  it('should have global rules to prevent selection and dragging on UI elements', () => {
    const cssPath = resolve(__dirname, '../index.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('.no-select');
    expect(cssContent).toContain('user-select: none');
    expect(cssContent).toContain('user-drag: none');
  });
});
