import nock from 'nock';
import {Mock} from './Mock';

export class MockAWSS3 extends Mock {
  private baseUrl: string;

  constructor(baseUrl: string) {
    super();
    this.baseUrl = baseUrl;
  }

  public mockChangeLastProcessedBlockNumber() {
    nock(this.baseUrl)
        .persist()
        .put('/last-block-number')
        .reply(200, '');
  }

  public mockGetLastProcessedBlockNumber(blockNumber: number = 600000) {
    nock(this.baseUrl)
        .persist()
        .get('/last-block-number')
        .reply(200, blockNumber.toString());
  }

  public cleanup() {
    nock.cleanAll();
  }
}
