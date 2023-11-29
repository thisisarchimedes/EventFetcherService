import { createLogger } from 'winston';
import WinstonNewrelicLogsTransport from 'winston-newrelic-logs-transport';
const logger = createLogger({
  transports: [
    new WinstonNewrelicLogsTransport({
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY ?? '',
      apiUrl: process.env.NEW_RELIC_API_URL ?? '',
    }),
  ],
});

export class Logger {
  info(message: string, metaData?: any): void {
    // logger.info(message, metaData ? metaData : '');
    console.info(message, metaData ? metaData : '');
  }

  // Function to log warnings
  warn(message: string, metaData?: any): void {
    // logger.warn(message, metaData ? metaData : '');
    console.warn(message, metaData ? metaData : '');
  }

  // Function to log errors
  error(message: string, error: Error, metaData?: any): void {
    // logger.error(message, error, metaData ? metaData : '');
    console.error(message, error, metaData ? metaData : '');
  }
}
