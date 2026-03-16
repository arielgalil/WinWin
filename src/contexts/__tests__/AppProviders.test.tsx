import { render, screen } from '@testing-library/react';
import { AppProviders } from '../AppProviders';
import { describe, it, expect } from 'vitest';

describe('AppProviders', () => {
    it('renders children without crashing', () => {
        render(
            <AppProviders>
                <div data-testid="test-child">Child Content</div>
            </AppProviders>
        );
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
});
