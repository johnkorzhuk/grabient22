import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start';
import * as Sentry from '@sentry/tanstackstart-react';

import { createRouter } from './router';

const router = createRouter();

export function initSentry() {
  // Skip Sentry initialization if DSN is not defined
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not found. Skipping Sentry initialization.');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

initSentry();

// Check if Sentry DSN is defined before creating error boundary
const AppComponent = process.env.SENTRY_DSN
  ? Sentry.withErrorBoundary(StartClient, {
      fallback: () => <div>An error has occurred. Our team has been notified.</div>,
    })
  : StartClient;

hydrateRoot(document, <AppComponent router={router} />);
