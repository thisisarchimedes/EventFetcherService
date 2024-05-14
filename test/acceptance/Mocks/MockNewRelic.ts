import nock from 'nock';
import {Mock} from './Mock';
import {EventFetcherLogEntryMessage, NewRelicLogEntry} from '../../../src/types/NewRelicLogEntry';

export class MockNewRelic extends Mock {
  private baseUrl: string;
  private waitedOnMessage!: string;
  private waitedOnMessageObserved: boolean = false;
  private logEntryToListenFor: string = '';

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
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
        });
  }

  public isWaitedOnMessageObserved(): boolean {
    return this.waitedOnMessageObserved;
  }

  public listenForLogEntry(entry: string): void {
    this.logEntryToListenFor = entry;
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
