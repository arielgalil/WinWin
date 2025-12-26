import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorScreen } from '../ErrorScreen';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

describe('ErrorScreen', () => {
    it('renders with the provided error message', () => {
        const testMessage = "Something went wrong!";
        render(<ErrorScreen message={testMessage} />);
        
        expect(screen.getByText('load_error')).toBeInTheDocument();
        expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('navigates to root when back button is clicked', () => {
        render(<ErrorScreen message="Error" />);
        
        fireEvent.click(screen.getByText('back_to_selection'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
