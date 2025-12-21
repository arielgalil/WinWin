
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ReactRouterDOM from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

import { LanguageProvider } from './contexts/LanguageContext';

const { HashRouter } = ReactRouterDOM as any;

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

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
