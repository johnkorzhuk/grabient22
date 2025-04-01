import { createMiddleware, registerGlobalMiddleware } from '@tanstack/react-start';
import * as Sentry from '@sentry/tanstackstart-react';

if (import.meta.env.VITE_SENTRY_DSN) {
  registerGlobalMiddleware({
    middleware: [createMiddleware().server(Sentry.sentryGlobalServerMiddlewareHandler())],
  });
}
