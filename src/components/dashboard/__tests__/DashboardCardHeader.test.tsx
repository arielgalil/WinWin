import { render } from '@testing-library/react';
import { DashboardCardHeader } from '../DashboardCardHeader';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('DashboardCardHeader', () => {
    it('renders title and icon', () => {
        const { getByText, getByTestId } = render(
            <DashboardCardHeader 
                title="Test Title" 
                icon={<div data-testid="test-icon">Icon</div>} 
                iconColorClass="text-red-500"
            />
        );

        expect(getByText('Test Title')).toBeInTheDocument();
        expect(getByTestId('test-icon')).toBeInTheDocument();
    });

    it('verifies wrapper structure', () => {
         const { container } = render(
            <DashboardCardHeader 
                title="Test Title" 
                icon={<div data-testid="test-icon">Icon</div>} 
                iconColorClass="text-red-500"
                iconBgClass="bg-blue-500"
            />
        );
        
        const wrapper = container.querySelector('.rounded-full');
        expect(wrapper).toBeInTheDocument();
    });
});
