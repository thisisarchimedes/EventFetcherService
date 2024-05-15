import nock from 'nock';
import {Mock} from './Mock';

export class MockAWSS3 extends Mock {
  private baseUrl: string;

  constructor(bucket: string, region: string) {
    super();
    this.baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  public mockChangeLastProcessedBlockNumber() {
    nock(this.baseUrl, {
      reqheaders: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        'x-amz-user-agent': (headerValue) => true,
      },
    })
        .persist()
        .put('/last-block-number?x-id=PutObject')
        .reply(200);
  }

  public mockGetLastProcessedBlockNumber(blockNumber: number = 600000) {
    nock(this.baseUrl, {
      reqheaders: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        'x-amz-user-agent': (headerValue) => true,
      },
    })
        .persist()
        .get('/last-block-number?x-id=GetObject')
        .reply(200, blockNumber.toString());
  }

  public cleanup() {
    nock.cleanAll();
  }
}
