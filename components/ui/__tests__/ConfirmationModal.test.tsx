import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock useLanguage to control direction
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    dir: 'rtl'
  })
}));

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Delete',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('confirm_action'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });

  it('hides cancel button when showCancel is false', () => {
    render(<ConfirmationModal {...defaultProps} showCancel={false} />);
    expect(screen.queryByText('cancel')).not.toBeInTheDocument();
  });

  it('renders confirm button on the right in RTL (first in DOM if using standard flex)', () => {
    // According to guidelines: Right-most: Delete (Confirm), Left-most: Edit/Secondary (Cancel)
    const { container } = render(<ConfirmationModal {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    // In RTL flex-row, the first element in DOM is the right-most visually.
    // So Confirm should be first if it needs to be right-most.
    expect(buttons[0]).toHaveTextContent('confirm_action');
    expect(buttons[1]).toHaveTextContent('cancel');
  });
});
