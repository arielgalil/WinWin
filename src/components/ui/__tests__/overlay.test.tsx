import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu';
import React from 'react';

test('DeleteConfirmDialog renders safety UI when isDanger is true', () => {
  render(
    <DeleteConfirmDialog
      isOpen={true}
      onOpenChange={() => {}}
      title="מחק פריט"
      description="האם אתה בטוח?"
      onConfirm={() => {}}
    />
  );
  
  // Check for the "Delete Safety" logic (red border class)
  const dialogContent = screen.getByRole('dialog');
  expect(dialogContent.className).toContain('border-destructive');
});

test('DeleteConfirmDialog calls onConfirm when delete button is clicked', () => {
  const onConfirm = vi.fn();
  render(
    <DeleteConfirmDialog
      isOpen={true}
      onOpenChange={() => {}}
      title="מחק פריט"
      description="האם אתה בטוח?"
      onConfirm={onConfirm}
    />
  );
  
  const deleteButton = screen.getByText('מחק');
  fireEvent.click(deleteButton);
  expect(onConfirm).toHaveBeenCalled();
});

test('DropdownMenu can be rendered with trigger', () => {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item 1</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
  expect(screen.getByText('Open')).toBeDefined();
});
