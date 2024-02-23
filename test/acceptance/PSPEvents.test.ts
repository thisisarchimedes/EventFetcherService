import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './Mocks/MockEthereumNode';
import {MockNewRelic} from './Mocks/MockNewRelic';
import {MockSQS} from './Mocks/MockSQS';
import {MockAWSS3} from './Mocks/MockAWSS3';

describe('PSP Events', function() {
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

  it('should catch and report on Deposit event', async function() {
    mockEthereumNodeResponses('test/data/depositEvent.json');

    await handler(0, 0);

    const expectedLog = createExpectedLogMessagePSPDeposit();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessage, expectedLog);
    expect(res).to.be.true;
  });

  function createExpectedLogMessagePSPDeposit(): EventFetcherLogEntryMessage {
    return {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      depositAmount: '5000000',
    };
  }

  it('should catch and report on Withdraw event', async function() {
    mockEthereumNodeResponses('test/data/withdrawEvent.json');

    await handler(0, 0);

    const expectedLog = createExpectedLogMessagePSPWithdraw();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessage, expectedLog);
    expect(res).to.be.true;
  });

  function createExpectedLogMessagePSPWithdraw(): EventFetcherLogEntryMessage {
    return {
      event: 'Withdraw',
      user: '0x2222222222222222222222222222222222222222',
      strategy: 'Convex ETH+/ETH Single Pool',
      depositAmount: '1',
    };
  }

  function validateLogMessage(
      actualLog: EventFetcherLogEntryMessage,
      expectedLog: EventFetcherLogEntryMessage,
  ): boolean {
    return (
      actualLog.event === expectedLog.event &&
      actualLog.user === expectedLog.user &&
      actualLog.strategy === expectedLog.strategy &&
      actualLog.depositAmount === expectedLog.depositAmount
    );
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
