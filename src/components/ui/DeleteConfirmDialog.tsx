import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'מחק',
  cancelText = 'ביטול',
  isDanger = true,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        isDanger && "border-destructive/50 border-2 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
      )}>
        <DialogHeader>
          <div className={cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4",
            isDanger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {isDanger ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2 text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "secondary" : "default"}
            onClick={onConfirm}
            className={cn(
                "flex-1 h-11 font-bold",
                isDanger && "hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}