import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useContext } from 'react';
import { LanguageProvider, LanguageContext } from '../LanguageContext';

const TestComponent = () => {
  const context = useContext(LanguageContext);
  if (!context) return null;
  return (
    <div>
      <span data-testid="lang">{context.language}</span>
      <span data-testid="dir">{context.dir}</span>
      <button onClick={() => context.setLanguage('en')}>Switch to EN</button>
      <button onClick={() => context.setLanguage('he')}>Switch to HE</button>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    document.documentElement.dir = '';
    document.documentElement.lang = '';
    localStorage.clear();
  });

  it('should initialize with default language (he)', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('he');
    expect(screen.getByTestId('dir').textContent).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('should change language and direction', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    act(() => {
      screen.getByText('Switch to EN').click();
    });

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('dir').textContent).toBe('ltr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.body.classList.contains('ltr')).toBe(true);
  });
});
