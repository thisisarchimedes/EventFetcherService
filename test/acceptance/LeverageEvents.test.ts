import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockSQS} from './Mocks/MockSQS';
import {MockAWSS3} from './Mocks/MockAWSS3';
import {mock} from 'aws-sdk-mock';
import {EventFetcherSQSMessage} from '../../src/types/SQSMessage';

import isEqual from 'lodash/isEqual';

import diff from 'fast-diff';

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

    expect(actualSQSMessage).to.not.be.null;
    const res: boolean = validateSQSMessage(actualSQSMessage, expectedSQSMessage);
    expect(res).to.be.true;
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

  function validateSQSMessage(actualLog: string, expectedLog: string): boolean {
    const actualMessage = JSON.parse(actualLog['MessageBody']);
    const expectedMessage = expectedLog['MessageBody'];

    return isEqual((actualMessage), (expectedMessage));
  }

  function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = process.env.NEW_RELIC_API_URL as string;
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
