/**
 * Logger utility for frontend application.
 * In production, logs are suppressed unless explicitly enabled.
 */

const isDevelopment = process.env.NODE_ENV === "development";

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

class AppLogger implements Logger {
  log(...args: unknown[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors, but in production we could send to error tracking service
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, you might want to send errors to a logging service
      // For now, we'll still log critical errors but without stack traces
      console.error("[Error]", ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (isDevelopment) {
      console.warn(...args);
    }
  }

  info(...args: unknown[]): void {
    if (isDevelopment) {
      console.info(...args);
    }
  }
}

export const logger = new AppLogger();
