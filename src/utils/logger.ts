// Production-safe logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = (): boolean => {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
};

const shouldLog = (level: LogLevel): boolean => {
  // In production, only log errors and warnings
  if (isProduction()) {
    return level === 'error' || level === 'warn';
  }
  return true; // In development, log everything
};

const formatLog = (level: LogLevel, ...args: any[]): string => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ')}`;
};

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', ...args));
    }
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log(formatLog('info', ...args));
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', ...args));
    }
  },
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error(formatLog('error', ...args));
    }
  }
};