import {Logger} from '@thisisarchimedes/backend-sdk';
import * as fs from 'fs';
import * as path from 'path';

export class LoggerPort extends Logger {
  private static instance: LoggerPort;
  private logFilePath: string;

  constructor(localFile: string) {
    super();
    this.logFilePath = path.resolve(localFile);
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;

    fs.appendFileSync(this.logFilePath, logMessage, { encoding: 'utf-8' });
  }

  public info(message: string): void {
    this.log('INFO', message);
  }

  public warning(message: string): void {
    this.log('WARNING', message);
  }

  public error(message: string): void {
    this.log('ERROR', message);
  }

  public getLastMessage(): string {
    try {
      const fileContent = fs.readFileSync(this.logFilePath, {encoding: 'utf-8'});
      const lines = fileContent.split('\n');
      // Filter out empty lines and return the last line
      const lastLine = lines.filter((line) => line.trim() !== '').pop() || 'No messages logged.';
      return lastLine;
    } catch (error) {
      console.error('Error reading log file:', error);
      return 'Error reading log file.';
    }
  }
}
