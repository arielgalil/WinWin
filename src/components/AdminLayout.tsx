import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { UserProfile } from '@/types';
import { Button } from './ui/button';
import { Logo } from './ui/Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu, Settings, Users, Target, LogOut, ArrowLeft, Sun, Moon, Share2, RefreshCw } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { formatLastSaved } from '@/utils/dateUtils';
import { SaveNotificationBadge } from '@/components/ui/SaveNotificationBadge';
import { Campaign, AppSettings } from '@/types';
import { CalculatorIcon, ClockIcon } from './ui/Icons';
import { VersionFooter } from './ui/VersionFooter'; // Corrected import

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly: boolean;
  divider?: boolean;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  campaignRole?: 'admin' | 'teacher' | 'superuser' | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewDashboard: () => void;
  onLogout: () => void;
  onShare: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  campaign?: Campaign;
  settings?: AppSettings;
  headerConfig: { icon: any; colorVar: string; title: string; desc: string; updatedAt?: string };
  activeNotification: any;
  dismissNotification: (tab: string) => void;
}

const NavLink: React.FC<{ item: NavItem; isActive: boolean; onClick: () => void; isCollapsed: boolean }> = ({ item, isActive, onClick, isCollapsed }) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    onClick={onClick}
    className={cn(
      'w-full h-11 text-base transition-all duration-200 hover:scale-105 hover:bg-accent hover:shadow-sm active:scale-95',
      isActive && 'font-bold shadow-sm',
      isCollapsed ? 'justify-center px-0' : 'justify-start gap-3'
    )}
    title={isCollapsed ? item.label : undefined}
  >
    <item.icon className="h-5 w-5 shrink-0" />
    {!isCollapsed && <span>{item.label}</span>}
  </Button>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, user, campaignRole, activeTab, onTabChange, onViewDashboard, onLogout, onShare, onManualRefresh, isRefreshing, campaign, settings, headerConfig, activeNotification, dismissNotification }) => {
  const { t, dir, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  const navItems: NavItem[] = [
    { id: 'settings', label: t('tab_settings' as any), icon: Settings, adminOnly: true },
    { id: 'data-management', label: t('tab_data_management' as any), icon: Users, adminOnly: true },
    { divider: true, id: 'divider-1', label: '', icon: () => null, adminOnly: false },
    { id: 'goals', label: t('tab_goals' as any), icon: Target, adminOnly: true },
    { id: 'points', label: t('tab_points' as any), icon: CalculatorIcon, adminOnly: false },
    { divider: true, id: 'divider-2', label: '', icon: () => null, adminOnly: false },
    { id: 'logs', label: t('tab_logs' as any), icon: ClockIcon, adminOnly: false },
  ];

  const visibleNavItems = useMemo(() => {
    const isAdmin = campaignRole === 'admin' || campaignRole === 'superuser'; // Simplified for layout
    return navItems.filter(item => {
      if (item.divider) return true;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [campaignRole, t]);

  const userRoleLabel = useMemo(() => {
    if (campaignRole === 'superuser') return t('role_super_user');
    if (campaignRole === 'admin') return t('role_admin');
    return t('role_teacher');
  }, [campaignRole, t]);

  const userInitials = useMemo(() => {
    const name = user.full_name?.trim() || 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [user.full_name]);

  return (
    <div className="flex min-h-screen bg-background text-foreground" dir={dir}>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card sticky top-0 h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("p-4 border-b border-border h-16 flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-accent/50 transition-colors shrink-0"
            title={isCollapsed ? t('expand' as any) : t('collapse' as any)}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </Button>
          {!isCollapsed && (
            <h1 className="text-xl font-bold whitespace-nowrap overflow-hidden text-foreground">{t('admin_panel' as any)}</h1>
          )}
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-x-hidden">
          {visibleNavItems.map((item, index) =>
            item.divider ? (
              <div key={`desktop-divider-${index}`} className="py-2">
                <hr className="border-border" />
              </div>
            ) : (
              <NavLink 
                key={item.id} 
                item={item} 
                isActive={activeTab === item.id} 
                onClick={() => onTabChange(item.id)}
                isCollapsed={isCollapsed}
              />
            )
          )}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Button 
            variant="ghost" 
            onClick={onViewDashboard} 
            className={cn("w-full h-11 text-base text-foreground hover:bg-accent/50 hover:scale-105 transition-all duration-200", isCollapsed ? "justify-center px-0" : "justify-start gap-3")}
            title={isCollapsed ? t('return_to_dashboard') : undefined}
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{t('return_to_dashboard')}</span>}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onLogout} 
            className={cn("w-full h-11 text-base text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-105 transition-all duration-200", isCollapsed ? "justify-center px-0" : "justify-start gap-3")}
            title={isCollapsed ? t('logout') : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{t('logout')}</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header and Sidebar */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-background sticky top-0 z-40">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open sidebar" className="text-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn("w-72 p-0 flex flex-col bg-card border-border", dir === 'rtl' ? "data-[state=open]:right-0 data-[state=open]:left-auto" : "data-[state=open]:left-0 data-[state=open]:right-auto")}>
              <SheetHeader className={cn(
                "p-4 border-b border-border h-16 flex-row items-center gap-3",
                dir === 'rtl' ? "pr-12" : "pl-12"
              )}>
                <SheetTitle className="text-xl font-bold text-foreground truncate">{t('admin_panel' as any)}</SheetTitle>
              </SheetHeader>
              <nav className="flex-1 flex flex-col gap-2 p-4">
                {visibleNavItems.map((item, index) =>
                  item.divider ? (
                    <div key={`mobile-divider-${index}`} className="py-2">
                      <hr className="border-border" />
                    </div>
                  ) : (
                    <NavLink key={item.id} item={item} isActive={activeTab === item.id} onClick={() => { onTabChange(item.id); setIsMobileMenuOpen(false); }} isCollapsed={false} />
                  )
                )}
              </nav>
              <div className="p-4 border-t border-border">
                <Button variant="ghost" onClick={onViewDashboard} className="w-full justify-start gap-3 h-11 text-base text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                  {t('return_to_dashboard')}
                </Button>
                <Button variant="ghost" onClick={onLogout} className="w-full justify-start gap-3 h-11 text-base text-destructive hover:bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                  {t('logout')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onManualRefresh} disabled={isRefreshing} title={t('refresh')} className="text-foreground">
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onShare} title={t('copy_link')} className="text-foreground">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('toggle_theme')} aria-label={t('toggle_theme')} className="text-foreground">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content Header */}
        <header className="hidden md:flex h-16 bg-card/80 border-b border-border items-center justify-between px-6 z-30 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <Logo src={campaign?.institution?.logo_url || campaign?.logo_url || settings?.logo_url} className="w-10 h-10 border-2 border-primary/20 shadow-sm" fallbackIcon="school" padding="p-1" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-foreground leading-none tracking-tight">{settings?.school_name || "Admin Panel"}</h1>
              <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase mt-1 opacity-80">{campaign?.name || 'Admin Console'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon"
                onClick={onManualRefresh}
                disabled={isRefreshing}
                title={t('refresh')}
                className="hover:scale-110 transition-transform"
              >
                <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
              </Button>

              <Button
                variant="ghost" size="icon"
                onClick={onShare}
                title={t('copy_link')}
                className="hover:scale-110 transition-transform"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost" size="icon"
                onClick={toggleTheme}
                title={t('toggle_theme')}
                aria-label={t('toggle_theme')}
                className="hover:scale-110 transition-transform"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Profile Section */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm sm:text-base font-medium text-foreground leading-none">{user.full_name}</p>
                <p className="text-[10px] sm:text-sm font-medium text-primary uppercase tracking-wide mt-1 opacity-80">
                  {userRoleLabel}
                </p>
              </div>
              <div className={cn(
                "hidden sm:flex w-10 h-10 rounded-full items-center justify-center font-bold shadow-lg text-sm ring-2 ring-offset-2 ring-offset-background ring-primary border-2 bg-gradient-to-br transition-all duration-300 no-select no-drag",
                theme === 'light' ? 'text-black border-black' : 'text-white border-white',
                campaignRole === 'superuser' ? 'from-amber-400 to-orange-500' : 'from-primary to-accent'
              )}>
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-gradient-high-energy">
          {/* Content Header (from old AdminPanel) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-border">
            <div className="flex items-center gap-5">
              <div 
                className="p-3.5 rounded-2xl bg-secondary shadow-sm border border-border flex items-center justify-center"
                style={{ color: headerConfig?.colorVar }}
              >
                {headerConfig && <headerConfig.icon className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-h1 text-foreground tracking-tight">{headerConfig?.title}</h2>
                <p className="text-muted-foreground font-medium text-base mt-1">{headerConfig?.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeNotification && (
                <SaveNotificationBadge
                  notification={activeNotification}
                  onDismiss={() => dismissNotification(activeTab)}
                />
              )}

              {!activeNotification && headerConfig?.updatedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-secondary px-3 py-1.5 rounded-full border border-border">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{(language === 'he' ? 'נשמר ' : 'Saved ')} {formatLastSaved(headerConfig.updatedAt, language)}</span>
                </div>
              )}
            </div>
          </div>
          {children}
        </main>
        <VersionFooter />
      </div>
    </div>
  );
};