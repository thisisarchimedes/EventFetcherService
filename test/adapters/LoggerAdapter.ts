import * as fs from 'fs';
import * as path from 'path';

import {Logger} from '../../src/services/logger/Logger';

export class LoggerAdapter extends Logger {
  private static instance: LoggerAdapter;
  private logFilePath: string;

  constructor(localFile: string) {
    super();
    this.logFilePath = path.resolve(localFile);
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    message = JSON.stringify(message);
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;

    fs.appendFileSync(this.logFilePath, logMessage, {encoding: 'utf-8'});
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

  public getLastMessageRawString(): string {
    try {
      const fileContent = fs.readFileSync(this.logFilePath, {encoding: 'utf-8'});
      const lines = fileContent.split('\n');
      const lastLine = lines.filter((line) => line.trim() !== '').pop() || 'No messages logged.';
      return lastLine;
    } catch (error) {
      console.error('Error reading log file:', error);
      return 'Error reading log file.';
    }
  }

  public getLastSeveralMessagesRawStrings(numLines: number): string[] {
    try {
      const fileContent = fs.readFileSync(this.logFilePath, {encoding: 'utf-8'});
      const lines = fileContent.split('\n');
      const lastLines = lines.filter((line) => line.trim() !== '').slice(-numLines);
      return lastLines.length > 0 ? lastLines : ['No messages logged.'];
    } catch (error) {
      console.error('Error reading log file:', error);
      return ['Error reading log file.'];
    }
  }

  // Implement the missing abstract members
  public debug(message: string): void {
    this.log('DEBUG', message);
  }

  public warn(message: string): void {
    this.log('WARN', message);
  }

  public flush(): Promise<void> {
    return Promise.resolve();
  }
}
