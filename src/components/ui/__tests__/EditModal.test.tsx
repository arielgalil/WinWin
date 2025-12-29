import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditModal } from '../EditModal';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { describe, it, expect, vi } from 'vitest';

const renderWithContext = (ui: React.ReactNode) => {
  return render(
    <LanguageProvider>
      {ui}
    </LanguageProvider>
  );
};

describe('EditModal', () => {
  it('renders correctly when open', () => {
    renderWithContext(
      <EditModal isOpen={true} onClose={() => {}} title="Edit Entity">
        <div>Modal Content</div>
      </EditModal>
    );

    expect(screen.getByText('Edit Entity')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithContext(
      <EditModal isOpen={true} onClose={onClose} title="Edit Entity">
        <div>Modal Content</div>
      </EditModal>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    renderWithContext(
      <EditModal isOpen={false} onClose={() => {}} title="Edit Entity">
        <div>Modal Content</div>
      </EditModal>
    );

    expect(screen.queryByText('Edit Entity')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });
});
