import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from '../hooks/useToast';

// Senior Dev Note: Configured for long-running dashboard displays (TVs)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true, // Critical for public dashboards on unstable WiFi
      staleTime: 1000 * 60 * 1, // 1 minute
    },
  },
});

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <HashRouter>
                                {children}
                            </HashRouter>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
};
