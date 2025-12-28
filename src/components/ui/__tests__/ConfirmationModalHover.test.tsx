
import { render, screen } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock dependencies
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    dir: 'rtl',
  }),
}));

describe('ConfirmationModal Hover States', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm',
    message: 'Message',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should have hover:bg-red-600 on danger confirm button', () => {
    render(<ConfirmationModal {...defaultProps} isDanger={true} />);
    const confirmButton = screen.getByText('confirm_action');
    expect(confirmButton).toHaveClass('hover:bg-red-600');
  });

  it('should have hover:bg-gray-200 on cancel button', () => {
    render(<ConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByText('cancel');
    expect(cancelButton).toHaveClass('hover:bg-gray-200');
  });
});
