import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorInfo } from 'react';

// Error boundary specifically for route components
export const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-4">The application encountered an error.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }
    onError={(error: Error, errorInfo: ErrorInfo) => {
      // Log error to monitoring service
      console.error('Route Error Boundary:', error, errorInfo);
      
      // TODO: Send error to monitoring service
      // sendErrorToMonitoring(error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);