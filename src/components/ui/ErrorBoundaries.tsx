import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const DashboardErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundary 
      fallback={fallback || (
        <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-[var(--radius-container)] p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-red-400 text-xl font-black mb-2">Dashboard Error</div>
            <div className="text-red-300 text-sm mb-4">The dashboard encountered an issue. Please refresh the page.</div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const AdminErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundary 
      fallback={fallback || (
        <div className="min-h-[200px] flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-red-400 text-lg font-bold mb-2">Admin Panel Error</div>
            <div className="text-red-300 text-sm">Please refresh and try again</div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export const ComponentErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundary 
      fallback={fallback || (
        <div className="min-h-[100px] flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-md p-3">
          <div className="text-center">
            <div className="text-red-400 text-sm font-medium mb-1">Component Error</div>
            <div className="text-red-300 text-xs">This component failed to load</div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};