import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  beforeSend(event) {
    // Filter out errors in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Add custom context
    event.tags = {
      ...event.tags,
      application: 'georgian-distribution-system',
      runtime: 'edge',
    }

    return event
  },
})
