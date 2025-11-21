import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking and monitoring
 * Only runs in production to avoid noise during development
 */
export function initSentry() {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,

      // Performance Monitoring
      integrations: [
        new Sentry.BrowserTracing({
          // Set sampling rate for performance monitoring
          tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
        }),
        // Session Replay for debugging
        new Sentry.Replay({
          maskAllText: true, // Mask sensitive text
          blockAllMedia: true, // Block media for privacy
        }),
      ],

      // Performance traces sample rate (10% of transactions)
      tracesSampleRate: 0.1,

      // Session Replay sample rates
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter sensitive data before sending to Sentry
      beforeSend(event, hint) {
        // Remove cookies and sensitive headers
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }

        // Filter out non-error events in production
        if (event.level === 'log' || event.level === 'info') {
          return null;
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extension errors
        'top.GLOBALS',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
        // User cancelled actions
        'AbortError',
      ],
    });

    // Set user context if available
    const storedUser = localStorage.getItem('supabase.auth.token');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData?.user) {
          Sentry.setUser({
            id: userData.user.id,
            email: userData.user.email,
          });
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
  }
}

/**
 * Capture an exception with additional context
 * @param error - The error to capture
 * @param context - Additional context for debugging
 */
export function captureException(error: Error | unknown, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      extra: context?.extra,
    });
  } else {
    // Log to console in development
    console.error('[Error]', error, context);
  }
}

/**
 * Capture a message with additional context
 * @param message - The message to capture
 * @param level - The severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      extra: context?.extra,
    });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}

// Re-export Sentry for direct access
export { Sentry };
