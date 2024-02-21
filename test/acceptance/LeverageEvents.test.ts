import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockSQS} from './Mocks/MockSQS';
import {MockAWSS3} from './Mocks/MockAWSS3';

import sinon from 'sinon';
import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';


let interceptedRequestBody = null;

describe('Leverage Events', function() {
  let logger: LoggerAdapter;
  let mockEthereumNode: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockSQS: MockSQS;
  let mockAWSS3: MockAWSS3;

  beforeEach(function() {
    initalizeMocks();
    setupNockInterceptors();

    mockSQS.mockSQSSendMessage();
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should process openPosition event and push messages to SQS', async function() {
    const region = 'us-east-1';
    const bucket = 'wbtc-engine-events-store';

    nock(`https://${bucket}.s3.${region}.amazonaws.com`, {
      reqheaders: {
        'x-amz-user-agent': (headerValue) => true,
      },
    })
        .get('/last-block-number?x-id=GetObject')
        .reply(200, '7000000');

    nock(`https://${bucket}.s3.${region}.amazonaws.com`, {
      reqheaders: {
        'x-amz-user-agent': (headerValue) => true,
      },
    })
        .put('/last-block-number?x-id=PutObject')
        .reply(200);

    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessage();
    const actualSQSMessage = mockSQS.getLatestMessage();

    expect(actualSQSMessage).to.not.be.null;
    const res: boolean = validateSQSMessage(actualSQSMessage, expectedSQSMessage);
    expect(res).to.be.true;
  });

  function createExpectedSQSMessage(): string {
    return JSON.stringify({
      MessageBody: {
        name: 'PositionLiquidated',
        contractType: 2,
        txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
        blockNumber: 6000003,
        data: {
          nftId: '2',
          strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
          wbtcDebtPaid: '5000000',
          claimableAmount: '5000000',
          liquidationFee: '5000000',
        },
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/240910251918/wbtc_engine_events_queue_demo',
      },
    });
  }
  
  


  function validateSQSMessage(actualLog: string, expectedLog: string): boolean {
    const actualMessage = JSON.stringify(actualLog);
    const expectedMessage = JSON.stringify(expectedLog);
    console.log('expected SQS message: ', actualMessage);
    console.log('Actual SQS message: ', expectedMessage);
    return JSON.stringify(actualMessage.MessageBody) === JSON.stringify(expectedMessage.MessageBody);
  }
  
  
  

  function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = process.env.NEW_RELIC_API_URL as string;
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);

    mockSQS = new MockSQS('https://sqs.us-east-1.amazonaws.com/');

    mockAWSS3 = new MockAWSS3('https://sqs.us-east-1.amazonaws.com');
  }

  function setupNockInterceptors() {
    mockEthereumNodeResponses();
    mockNewRelicLogEndpoint();

    mockAWSS3.mockChangeLastProcessedBlockNumber();
    mockAWSS3.mockGetLastProcessedBlockNumber(6000000);
  }

  function mockEthereumNodeResponses() {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse('test/data/leveragePositionOpenedEvent.json');
  }

  function mockNewRelicLogEndpoint() {
    mockNewRelic.mockLogEndpoint();
  }

  function cleanupNock() {
    nock.cleanAll();
  }
});
