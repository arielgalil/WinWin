import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { 
  Menu, 
  LogOut, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Share2, 
  RefreshCw
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { formatLastSaved } from '@/utils/dateUtils';
import { Clock } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  divider?: boolean;
}

export interface WorkspaceLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onViewDashboard: () => void;
  user: {
    full_name: string;
    initials: string;
    roleLabel: string;
    avatarUrl?: string;
  };
  institution: {
    name: string;
    logoUrl?: string;
  };
  headerActions?: React.ReactNode;
  headerTitle?: string;
  headerDescription?: string;
  headerIcon?: React.ElementType;
  headerColorVar?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onShare?: () => void;
  showVersion?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  lastSavedAt?: string;
}

const NavLink: React.FC<{ 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void; 
  isCollapsed: boolean;
  dir: 'rtl' | 'ltr';
}> = ({ item, isActive, onClick, isCollapsed, dir }) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    onClick={onClick}
    className={cn(
      'w-full h-11 transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]',
      isActive && 'font-bold shadow-sm bg-secondary',
      isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
    )}
    title={isCollapsed ? item.label : undefined}
  >
    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
    {!isCollapsed && <span className="truncate">{item.label}</span>}
  </Button>
);

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
  onViewDashboard,
  user,
  institution,
  headerActions,
  headerTitle,
  headerDescription,
  headerIcon: HeaderIcon,
  headerColorVar,
  isRefreshing,
  onRefresh,
  onShare,
  showVersion = true,
  breadcrumbs,
  lastSavedAt
}) => {
  const { t, dir, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage('workspace-sidebar-collapsed', false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const sidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-card border-border">
      {/* Sidebar Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-border transition-all duration-300",
        collapsed ? "justify-center" : "px-4 gap-3"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:flex hover:bg-accent/50 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {!collapsed && (
          <span className="font-bold text-lg truncate">{t('admin_panel')}</span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
        {navItems.map((item, idx) => (
          item.divider ? (
            <div key={`div-${idx}`} className="my-2 border-t border-border/50" />
          ) : (
            <NavLink
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              isCollapsed={collapsed}
              dir={dir as any}
            />
          )
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className={cn("p-3 border-t border-border flex flex-col gap-1", collapsed && "items-center")}>
        <Button
          variant="ghost"
          onClick={onViewDashboard}
          className={cn(
            "w-full h-10 hover:bg-accent/50 transition-all text-sm",
            collapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
          )}
          title={collapsed ? t('return_to_dashboard') : undefined}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span>{t('return_to_dashboard')}</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full h-10 text-destructive hover:bg-destructive/10 transition-all text-sm",
            collapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
          )}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t('logout')}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground selection:bg-primary/20" dir={dir}>
      {/* Desktop Sidebar Container */}
      <aside 
        className={cn(
          "hidden lg:block border-e border-border sticky top-0 h-screen transition-all duration-300 ease-in-out z-40",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent(isCollapsed)}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side={dir === 'rtl' ? 'right' : 'left'} 
                className="p-0 w-72 border-none"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                {sidebarContent(false)}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
               <Logo 
                  src={institution.logoUrl} 
                  className="w-8 h-8 lg:w-9 lg:h-9 border border-border rounded-lg shadow-sm" 
                  fallbackIcon="school"
                  padding="p-1"
               />
               <div className="hidden sm:block">
                  <h2 className="text-sm lg:text-base font-bold leading-none truncate max-w-[150px] lg:max-w-[200px]">
                    {institution.name}
                  </h2>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-1 border-e border-border pe-2 me-2">
              {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="h-9 w-9" aria-label={t('refresh')}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              )}
              {onShare && (
                <Button variant="ghost" size="icon" onClick={onShare} className="h-9 w-9" aria-label={t('copy_link')}>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label={t('toggle_theme')}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="hidden md:block text-end">
                <p className="text-xs lg:text-sm font-bold leading-none">{user.full_name}</p>
                <p className="text-[10px] lg:text-xs text-primary font-medium mt-1 uppercase tracking-wider opacity-80">{user.roleLabel}</p>
              </div>
              <div className={cn(
                "w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-border border bg-gradient-to-br from-primary/10 to-accent/10 no-select no-drag",
                theme === 'light' ? 'text-black' : 'text-white'
              )}>
                {user.initials}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Header */}
        {(headerTitle || HeaderIcon) && (
          <div className="bg-card border-b border-border px-4 lg:px-8 py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 lg:gap-6">
                  {HeaderIcon && (
                    <div 
                      className="p-3 lg:p-4 rounded-2xl bg-muted shadow-sm border border-border/50 flex items-center justify-center shrink-0"
                      style={{ color: headerColorVar }}
                    >
                      <HeaderIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-h2 lg:text-h1 text-foreground tracking-tight leading-tight">
                      {headerTitle}
                    </h1>
                    {headerDescription && (
                      <p className="text-sm lg:text-base text-muted-foreground font-medium mt-1 lg:mt-2 opacity-80">
                        {headerDescription}
                      </p>
                    )}
                  </div>
                </div>
                {headerActions && (
                  <div className="flex items-center gap-3 shrink-0">
                    {headerActions}
                  </div>
                )}
                {!headerActions && lastSavedAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-muted px-3 py-1.5 rounded-full border border-border self-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{(language === 'he' ? 'נשמר ' : 'Saved ')} {formatLastSaved(lastSavedAt, language)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
            {children}
          </div>
          {showVersion && (
            <div className="mt-auto">
              <VersionFooter />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
