import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TrashIcon } from '../Icons';

// Mock dependencies
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    dir: 'rtl',
  }),
}));

// Mock Icons to check for their presence
vi.mock('../Icons', async () => {
    const actual = await vi.importActual('../Icons');
    return {
        ...actual,
        AlertIcon: () => <div data-testid="alert-icon" />,
        TrashIcon: () => <div data-testid="trash-icon" />,
    };
});


describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders when isOpen is true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirmMock} />);
    fireEvent.click(screen.getByText('confirm_action'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = vi.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancelMock} />);
    fireEvent.click(screen.getByText('cancel'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancelMock = vi.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancelMock} />);
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('applies danger styling when isDanger is true', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} isDanger={true} />);
    const modalDiv = container.querySelector('.relative');
    expect(modalDiv).toHaveClass('border-red-500');
  });

  it('shows TrashIcon instead of AlertIcon when isDanger is true', () => {
    render(<ConfirmationModal {...defaultProps} isDanger={true} />);
    expect(screen.queryByTestId('alert-icon')).toBeNull();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('focuses the confirm button on open', async () => {
    render(<ConfirmationModal {...defaultProps} />);
    await waitFor(() => {
        expect(screen.getByText('confirm_action')).toHaveFocus();
    });
  });

});