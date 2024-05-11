import nock from 'nock';
import {Mock} from './Mock';
import {LoggerAdapter} from '../../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage, NewRelicLogEntry} from '../../../src/types/NewRelicLogEntry';

export class MockNewRelic extends Mock {
  private baseUrl: string;
  private waitedOnMessage!: string;
  private waitedOnMessageObserved: boolean = false;
  private logEntryToListenFor: string = '';
  private logEntryDetected: boolean = false;
  private logger: LoggerAdapter;

  constructor(baseUrl: string, logger: LoggerAdapter) {
    super();
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  public setWaitedOnMessage(message: string): void {
    this.waitedOnMessage = message;
    this.waitedOnMessageObserved = false;

    nock(this.baseUrl)
        .persist()
        .post('/log/v1', () => true)
        .reply(200, (_, requestBody) => {
          const includesWaitedOnMessage = JSON.stringify(requestBody).includes(this.waitedOnMessage);
          if (includesWaitedOnMessage) {
            this.waitedOnMessageObserved = true;
          }
          if (JSON.stringify(requestBody).includes(this.logEntryToListenFor)) {
            this.logEntryDetected = true;
          }
        });
  }

  public findMatchingLogEntry(): EventFetcherLogEntryMessage | null {
    const logLines = this.logger.getLastSeveralMessagesRawStrings(5);

    for (let i = logLines.length - 1; i >= 0; i--) {
      const logEntry = this.parseLogEntry(logLines[i]);
      if (logEntry == null) {
        continue;
      }

      return logEntry;
    }

    return null;
  }

  public isWaitedOnMessageObserved(): boolean {
    return this.waitedOnMessageObserved;
  }

  public listenForLogEntry(entry: string): void {
    this.logEntryToListenFor = entry;
  }

  public isLogEntryDetected(): boolean {
    return this.logEntryDetected;
  }

  private parseLogEntry(logLine: string): EventFetcherLogEntryMessage | null {
    try {
      const logEntry: NewRelicLogEntry = JSON.parse(JSON.parse(logLine.split('INFO: ')[1]));
      return JSON.parse(String(logEntry.message));
    } catch (error) {
      return null;
    }
  }
}
