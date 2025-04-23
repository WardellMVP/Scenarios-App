/**
 * Centralized Logger Module
 * 
 * This module provides a standardized logging interface that can be used
 * across the application. It can be easily replaced with more sophisticated
 * logging solutions when deployed to production environments.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  source?: string;
  timestamp?: boolean;
  level?: LogLevel;
}

/**
 * Default log options
 */
const defaultOptions: LogOptions = {
  timestamp: true,
  level: 'info',
};

/**
 * Get the current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Determine if a log message should be shown based on environment
 * and log level
 */
function shouldLog(level: LogLevel): boolean {
  const env = process.env.NODE_ENV || 'development';
  
  // In production, only show warns and errors by default
  if (env === 'production') {
    return level === 'warn' || level === 'error';
  }
  
  // In development, show all logs
  return true;
}

/**
 * Log a message with the given level
 */
function logMessage(message: string, options: LogOptions = {}): void {
  const opts = { ...defaultOptions, ...options };
  const { level = 'info', source, timestamp } = opts;
  
  if (!shouldLog(level)) {
    return;
  }
  
  const prefix = [];
  if (timestamp) {
    prefix.push(getTimestamp());
  }
  
  if (source) {
    prefix.push(`[${source}]`);
  }
  
  const formattedMessage = prefix.length > 0 
    ? `${prefix.join(' ')} ${message}` 
    : message;
  
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
}

/**
 * Logger module interface
 */
export const logger = {
  debug: (message: string, source?: string) => 
    logMessage(message, { level: 'debug', source }),
    
  info: (message: string, source?: string) => 
    logMessage(message, { level: 'info', source }),
    
  warn: (message: string, source?: string) => 
    logMessage(message, { level: 'warn', source }),
    
  error: (message: string, source?: string) => 
    logMessage(message, { level: 'error', source }),
    
  log: logMessage,
};