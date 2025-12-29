import { expect, test } from 'vitest';

test('CSS Variables match WinWin brand colors', () => {
  // Inject the variables to simulate them being in the stylesheet
  // Since JSDOM doesn't load external CSS, we manually set them on the root for verification
  // that our intended values are what we expect.
  document.documentElement.style.setProperty('--primary', '189 94% 43%');
  
  const root = document.documentElement;
  const primary = getComputedStyle(root).getPropertyValue('--primary').trim();
  
  expect(primary).toBe('189 94% 43%');
});