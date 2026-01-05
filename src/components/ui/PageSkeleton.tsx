import React from 'react';

interface PageSkeletonProps {
    /** Type of page skeleton to render */
    type?: 'dashboard' | 'admin' | 'vote' | 'generic';
    /** Optional message to show (for accessibility) */
    message?: string;
}

/**
 * A skeleton loading component that renders a page shell
 * with animated placeholder elements while content loads.
 * This provides immediate visual feedback without blocking.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ type = 'generic', message }) => {
    const pulseClass = 'animate-pulse bg-[var(--bg-card-secondary)]';
    
    return (
        <div 
            className="flex flex-col h-full w-full" 
            role="progressbar" 
            aria-label={message || 'Loading page content'}
            aria-busy="true"
        >
            {/* Header skeleton */}
            <div className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-default)] flex items-center px-4 gap-4">
                <div className={`w-10 h-10 rounded-full ${pulseClass}`} />
                <div className={`h-6 w-48 rounded ${pulseClass}`} />
                <div className="flex-1" />
                <div className={`h-8 w-24 rounded ${pulseClass}`} />
            </div>

            {/* Content area */}
            <div className="flex-1 p-4 overflow-hidden">
                {type === 'dashboard' && <DashboardSkeleton pulseClass={pulseClass} />}
                {type === 'admin' && <AdminSkeleton pulseClass={pulseClass} />}
                {type === 'vote' && <VoteSkeleton pulseClass={pulseClass} />}
                {type === 'generic' && <GenericSkeleton pulseClass={pulseClass} />}
            </div>
        </div>
    );
};

const DashboardSkeleton: React.FC<{ pulseClass: string }> = ({ pulseClass }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-24 rounded-xl ${pulseClass}`} />
                ))}
            </div>
            {/* Main chart area */}
            <div className={`h-64 rounded-xl ${pulseClass}`} />
            {/* Ticker area */}
            <div className={`h-32 rounded-xl ${pulseClass}`} />
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
            <div className={`h-48 rounded-xl ${pulseClass}`} />
            <div className={`h-48 rounded-xl ${pulseClass}`} />
        </div>
    </div>
);

const AdminSkeleton: React.FC<{ pulseClass: string }> = ({ pulseClass }) => (
    <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-10 w-24 rounded ${pulseClass}`} />
            ))}
        </div>
        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-48 rounded-xl ${pulseClass}`} />
            ))}
        </div>
    </div>
);

const VoteSkeleton: React.FC<{ pulseClass: string }> = ({ pulseClass }) => (
    <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* Class selector */}
        <div className={`h-12 rounded-lg ${pulseClass}`} />
        {/* Score input */}
        <div className={`h-24 rounded-xl ${pulseClass}`} />
        {/* Recent votes */}
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className={`h-16 rounded-lg ${pulseClass}`} />
            ))}
        </div>
    </div>
);

const GenericSkeleton: React.FC<{ pulseClass: string }> = ({ pulseClass }) => (
    <div className="space-y-4">
        <div className={`h-8 w-64 rounded ${pulseClass}`} />
        <div className={`h-48 rounded-xl ${pulseClass}`} />
        <div className={`h-32 rounded-xl ${pulseClass}`} />
    </div>
);
