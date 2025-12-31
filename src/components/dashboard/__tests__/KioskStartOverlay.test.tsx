import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KioskStartOverlay } from '../KioskStartOverlay';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import React from 'react';

// Wrap with provider
const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <LanguageProvider>
            {ui}
        </LanguageProvider>
    );
};

describe('KioskStartOverlay', () => {
    it('should render when isVisible is true', () => {
        renderWithProvider(<KioskStartOverlay isVisible={true} onStart={() => {}} />);
        // Look for the title (using Hebrew as it's the default in tests usually, or check both)
        expect(screen.getByText(/מוכנים להתחיל/i)).toBeDefined();
    });

    it('should not render when isVisible is false', () => {
        const { container } = renderWithProvider(<KioskStartOverlay isVisible={false} onStart={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('should call onStart when button is clicked', () => {
        const onStartMock = vi.fn();
        renderWithProvider(<KioskStartOverlay isVisible={true} onStart={onStartMock} />);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(onStartMock).toHaveBeenCalledTimes(1);
    });
});
