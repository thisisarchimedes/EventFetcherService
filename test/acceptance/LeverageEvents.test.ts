import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockSQS} from './Mocks/MockSQS';
import {MockAWSS3} from './Mocks/MockAWSS3';

describe('Leverage Events', function() {
  let logger: LoggerAdapter;
  let mockEthereumNode: MockEthereumNode;
  let mockNewRelic: MockNewRelic;
  let mockSQS: MockSQS;
  let mockAWSS3: MockAWSS3;

  beforeEach(function() {
    initalizeMocks();
    setupNockInterceptors();
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should process openPosition event and push messages to SQS', async function() {
    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessagePositionLiquidated();
    const actualSQSMessage = mockSQS.getLatestMessage();

    expect(actualSQSMessage).to.not.be.null;
    const res: boolean = validateSQSMessage(actualSQSMessage, expectedSQSMessage);
    expect(res).to.be.true;
  });

  function createExpectedSQSMessagePositionLiquidated(): string {
    // How we expect ETH Log message in leveragePositionOpenedEvent.json to be formatted on the SQS side
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
    return JSON.stringify(actualMessage.MessageBody) === JSON.stringify(expectedMessage.MessageBody);
  }

  function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = process.env.NEW_RELIC_API_URL as string;
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);

    mockSQS = new MockSQS('https://sqs.us-east-1.amazonaws.com/');

    mockAWSS3 = new MockAWSS3('wbtc-engine-events-store', 'us-east-1');
  }

  function setupNockInterceptors() {
    mockEthereumNodeResponses();
    mockNewRelicLogEndpoint();
    mockAWSS3Endpoint();
    mockSQSEndpoint();
  }

  function mockEthereumNodeResponses() {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse('test/data/leveragePositionOpenedEvent.json');
  }

  function mockNewRelicLogEndpoint() {
    mockNewRelic.mockLogEndpoint();
  }

  function mockAWSS3Endpoint() {
    mockAWSS3.mockChangeLastProcessedBlockNumber();
    mockAWSS3.mockGetLastProcessedBlockNumber(7000000);
  }

  function mockSQSEndpoint() {
    mockSQS.mockSQSSendMessage();
  }

  function cleanupNock() {
    nock.cleanAll();
  }
});
