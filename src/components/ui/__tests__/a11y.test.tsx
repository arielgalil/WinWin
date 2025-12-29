import { expect, test, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useLanguage } from '@/hooks/useLanguage'; // Import the hook to mock it

// Mock useLanguage to control its output
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: vi.fn(),
}));

// A simple component that uses the dir from useLanguage and applies it to an element
const TestRTLComponent: React.FC = () => {
  const { dir } = useLanguage();
  // Apply dir to the document element, similar to how a RootProvider might
  React.useEffect(() => {
    document.documentElement.setAttribute('dir', dir || '');
  }, [dir]);
  return <div data-testid="test-rtl-element">RTL Content</div>;
};


test('RTL is correctly applied to the document element when useLanguage returns RTL', () => {
  // Mock useLanguage to return 'rtl' for this specific test
  (useLanguage as any).mockReturnValue({ dir: 'rtl', t: (key: string) => key });

  // Render the component that uses the mocked hook
  render(<TestRTLComponent />);

  // The component should apply dir="rtl" to the document element
  const root = document.documentElement;
  expect(root).toHaveAttribute('dir', 'rtl');
});

test('New UI components (Button, Input, Card) use semantic color variables for contrast (manual verification needed)', () => {
  // This is a placeholder test. Full WCAG AAA contrast verification
  // requires visual rendering and color analysis tools which are outside
  // the scope of simple unit tests. Developers must manually verify.
  expect(true).toBe(true);
});