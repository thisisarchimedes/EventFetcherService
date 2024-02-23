import {expect} from 'chai';
import nock from 'nock';
import isEqual from 'lodash/isEqual';

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
    setupGenericNockInterceptors();
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should process PositionOpened event and push messages to SQS', async function() {
    mockEthereumNodeResponses('test/data/leveragePositionOpenedEvent.json');
    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessagePositionOpened();
    const actualSQSMessage = mockSQS.getLatestMessage();

    validateSQSMessage(actualSQSMessage, expectedSQSMessage);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createExpectedSQSMessagePositionOpened(): any {
    // This is how we expect ETH Log message in leveragePositionOpenedEvent.json to be formatted on the SQS side
    return {
      MessageBody: {
        name: 'PositionOpened',
        contractType: 0,
        txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
        blockNumber: 6000003,
        data: {
          nftId: 2,
          user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
          strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
          collateralAmount: '1',
          wbtcToBorrow: '2',
          positionExpireBlock: '3',
          sharesReceived: '4',
        },
      },
    };
  }

  it('should process PositionClosed event and push messages to SQS', async function() {
    mockEthereumNodeResponses('test/data/leveragePositionClosedEvent.json');
    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessagePositionClosed();
    const actualSQSMessage = mockSQS.getLatestMessage();

    validateSQSMessage(actualSQSMessage, expectedSQSMessage);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createExpectedSQSMessagePositionClosed(): any {
    // This is how we expect ETH Log message in leveragePositionClosedEvent.json to be formatted on the SQS side
    return {
      MessageBody: {
        name: 'PositionClosed',
        contractType: 1,
        txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
        blockNumber: 6000003,
        data: {
          nftId: 2,
          user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
          receivedAmount: '1',
          wbtcDebtAmount: '2',
        },
      },
    };
  }

  it('should process PositionLiquidated event and push messages to SQS', async function() {
    mockEthereumNodeResponses('test/data/leveragePositionLiquidatedEvent.json');
    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessagePositionLiquidated();
    const actualSQSMessage = mockSQS.getLatestMessage();

    validateSQSMessage(actualSQSMessage, expectedSQSMessage);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createExpectedSQSMessagePositionLiquidated(): any {
    // This is how we expect ETH Log message in leveragePositionClosedEvent.json to be formatted on the SQS side
    return {
      MessageBody: {
        name: 'PositionLiquidated',
        contractType: 2,
        txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
        blockNumber: 6000003,
        data: {
          nftId: 2,
          strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
          wbtcDebtPaid: '1',
          claimableAmount: '2',
          liquidationFee: '3',
        },
      },
    };
  }

  it('should process PositionExpired event and push messages to SQS', async function() {
    mockEthereumNodeResponses('test/data/leveragePositionExpiredEvent.json');
    await handler(0, 0);

    const expectedSQSMessage = createExpectedSQSMessagePositionExpired();
    const actualSQSMessage = mockSQS.getLatestMessage();

    validateSQSMessage(actualSQSMessage, expectedSQSMessage);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createExpectedSQSMessagePositionExpired(): any {
    // This is how we expect ETH Log message in leveragePositionClosedEvent.json to be formatted on the SQS side
    return {
      MessageBody: {
        name: 'PositionExpired',
        contractType: 3,
        txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
        blockNumber: 6000003,
        data: {
          nftId: 2,
          user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
          claimableAmount: '1',
        },
      },
    };
  }

  function validateSQSMessage(actualLog: string, expectedLog: string): void {
    expect(actualLog).to.not.be.null;

    const actualMessage = JSON.parse(actualLog['MessageBody']);
    const expectedMessage = expectedLog['MessageBody'];

    const res = isEqual((actualMessage), (expectedMessage));
    expect(res).to.be.true;
  }

  function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = 'https://log-api.newrelic.com';
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);

    mockSQS = new MockSQS('https://sqs.us-east-1.amazonaws.com/');

    mockAWSS3 = new MockAWSS3('wbtc-engine-events-store', 'us-east-1');
  }

  function setupGenericNockInterceptors() {
    mockNewRelicLogEndpoint();
    mockAWSS3Endpoint();
    mockSQSEndpoint();
  }

  function mockEthereumNodeResponses(syntheticEventFile: string) {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber('0x5B8D86');
    mockEthereumNode.mockEventResponse(syntheticEventFile);
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
