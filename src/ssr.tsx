import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { getRouterManifest } from '@tanstack/react-start/router-manifest';
import * as Sentry from '@sentry/tanstackstart-react';
import { createRouter } from './router';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: process.env.PROD ? 0.1 : 1.0,
});

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(
  process.env.SENTRY_DSN
    ? Sentry.wrapStreamHandlerWithSentry(defaultStreamHandler)
    : defaultStreamHandler,
);
