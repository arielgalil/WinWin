import React from 'react';
import { EditIcon, TrashIcon } from './Icons';
import { AdminActionButton } from './AdminActionButton';

interface AdminRowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onSecondary?: () => void;
  secondaryIcon?: React.ReactNode;
  secondaryTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
}

export const AdminRowActions: React.FC<AdminRowActionsProps> = ({
  onEdit,
  onDelete,
  onSecondary,
  secondaryIcon,
  secondaryTitle = 'secondary',
  editTitle = 'edit',
  deleteTitle = 'delete',
}) => {
  return (
    <div className="flex items-center justify-end gap-2 w-full">
      {/* 
        RTL Layout Strategy:
        In standard LTR DOM order (flex-row), the first element is on the left.
        We want [Delete] [Secondary] [Edit] visually in RTL (Right to Left).
        
        If the parent container has `dir="rtl"`, standard flex-row renders:
        [First Child] [Second Child] [Third Child] -> (Right -> Left)
        
        So:
        1. Delete (Right-most)
        2. Secondary (Middle)
        3. Edit (Left-most)
      */}
      
      {onDelete && (
        <AdminActionButton 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          variant="delete" 
          title={deleteTitle}
          className="ml-6"
        >
          <TrashIcon className="w-4 h-4" />
        </AdminActionButton>
      )}

      {onSecondary && secondaryIcon && (
        <AdminActionButton onClick={(e) => { e.stopPropagation(); onSecondary(); }} variant="secondary" title={secondaryTitle}>
          {secondaryIcon}
        </AdminActionButton>
      )}

      {onEdit && (
        <AdminActionButton onClick={(e) => { e.stopPropagation(); onEdit(); }} variant="edit" title={editTitle}>
          <EditIcon className="w-4 h-4" />
        </AdminActionButton>
      )}
    </div>
  );
};
