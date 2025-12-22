interface LogContext {
  component?: string;
  action?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log = (level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: LogContext) => {
    if (!this.isDevelopment) return;

    const timestamp = new Date().toISOString();
    const prefix = context ? `[${timestamp}] [${context.component || 'App'}${context.action ? `:${context.action}` : ''}]` : `[${timestamp}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, context?.data);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, context?.data);
        break;
      case 'info':
        console.info(`${prefix} ${message}`, context?.data);
        break;
      case 'debug':
        console.log(`${prefix} ${message}`, context?.data);
        break;
    }
  };

  error = (message: string, context?: LogContext) => this.log('error', message, context);
  warn = (message: string, context?: LogContext) => this.log('warn', message, context);
  info = (message: string, context?: LogContext) => this.log('info', message, context);
  debug = (message: string, context?: LogContext) => this.log('debug', message, context);
}

export const logger = new Logger();