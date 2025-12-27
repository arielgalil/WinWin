import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppProviders } from './contexts/AppProviders';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, reload to update.");
  },
  onOfflineReady() {
    console.log("App is ready for offline usage.");
  },
});
console.log('SW registered:', updateSW);

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
