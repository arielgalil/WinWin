import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProviders } from './contexts/AppProviders';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
