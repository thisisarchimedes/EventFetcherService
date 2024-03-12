import nock from 'nock';
import {LoggerAdapter} from '../../adapters/LoggerAdapter';
import {Mock} from './Mock';
import {EventFetcherLogEntryMessage, NewRelicLogEntry} from '../../../src/types/NewRelicLogEntry';

export class MockNewRelic extends Mock {
  private baseUrl: string;
  private logger: LoggerAdapter;

  private logEntryToListenFor: string = '';
  private logEntryDetected: boolean = false;

  constructor(baseUrl: string, logger: LoggerAdapter) {
    super();
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  public mockLogEndpoint() {
    nock(this.baseUrl)
        .persist()
        .post('/log/v1', () => true)
        .reply(200, (_, requestBody) => {
          this.logger.info(JSON.stringify(requestBody));
          if (JSON.stringify(requestBody).includes(this.logEntryToListenFor)) {
            this.logEntryDetected = true;
          }
          return {};
        });
  }

  public listenForLogEntry(entry: string): void {
    this.logEntryToListenFor = entry;
  }

  public isLogEntryDetected(): boolean {
    return this.logEntryDetected;
  }

  public findMatchingLogEntry(logger: LoggerAdapter): EventFetcherLogEntryMessage | null {
    const logLines = logger.getLastSeveralMessagesRawStrings(5);

    for (let i = logLines.length - 1; i >= 0; i--) {
      const logEntry = this.parseLogEntry(logLines[i]);
      if (logEntry == null) {
        continue;
      }
      return logEntry;
    }

    return null;
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
