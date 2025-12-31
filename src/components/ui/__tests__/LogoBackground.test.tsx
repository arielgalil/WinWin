import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Logo } from '../Logo';

describe('Logo Component Background', () => {
    it('uses a fixed soft white-gray background (#f8fafc)', () => {
        const { container } = render(<Logo />);
        const logoDiv = container.firstChild as HTMLElement;
        expect(logoDiv.className).toContain('bg-[#f8fafc]');
    });

    it('has no-select and no-drag classes', () => {
        const { container } = render(<Logo />);
        const logoDiv = container.firstChild as HTMLElement;
        expect(logoDiv.className).toContain('no-select');
        expect(logoDiv.className).toContain('no-drag');
    });
});
