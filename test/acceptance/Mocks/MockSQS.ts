import nock from 'nock';
import {Mock} from './Mock';

export class MockSQS extends Mock {
  private sqsUrl: string = '';
  private LastMessageToQueue: string = '';

  constructor(sqsUrl: string) {
    super();
    this.sqsUrl = sqsUrl;
  }

  public mockSQSSendMessage() {
    nock(this.sqsUrl)
        .persist()
        .post('/', (body) => {
          this.LastMessageToQueue = body;
          return true;
        })
        .reply(200, {});
  }

  public getLatestMessage(): string {
    return this.LastMessageToQueue;
  }
}
