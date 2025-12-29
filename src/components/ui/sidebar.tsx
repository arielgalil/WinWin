import React, { useState } from 'react';
import { Button } from './button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Menu, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  // Add props for navigation items later
  direction?: 'ltr' | 'rtl';
}

export const Sidebar: React.FC<SidebarProps> = ({ direction = 'ltr' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold">Admin Menu</h2>
      <nav className="flex flex-col gap-2">
        <Button variant="ghost" className="justify-start">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        {/* More navigation items */}
      </nav>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side={direction === 'rtl' ? 'right' : 'left'}
        className={cn("w-64 p-0", direction === 'rtl' ? "!inset-y-0 !left-auto !right-0" : "")}
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl">WinWin Admin</SheetTitle>
          <SheetDescription>Manage your platform</SheetDescription>
        </SheetHeader>
        {sidebarContent}
      </SheetContent>
    </Sheet>
  );
};
