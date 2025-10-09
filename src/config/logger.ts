import { config } from "./env";

class Logger {
  private isDev = config.isDevelopment;

  private formatMessage(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('ERROR', message, error));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  debug(message: string, meta?: any) {
    if (this.isDev) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

export const logger = new Logger();

