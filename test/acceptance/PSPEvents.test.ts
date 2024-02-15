import {expect} from 'chai';
import nock from 'nock';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/lambda-handler';

import {MockEthereumNode} from './MockEthereumNode';
import {MockNewRelic} from './MockNewRelic';

describe('PSP Events', function() {
  let logger: LoggerAdapter;
  let mockEthereumNode: MockEthereumNode;
  let mockNewRelic: MockNewRelic;

  beforeEach(function() {
    console.log('>> 0 - beforeEach');
    initalizeMocks();
    console.log('>> 1 - beforeEach');
    setupNockInterceptors();
    console.log('>> 2 - beforeEach');
  });

  afterEach(function() {
    cleanupNock();
  });

  it('should catch and report on Deposit event', async function() {
    console.log('>> 0 - Test');
    await handler(0, 0);
    console.log('>> 1 - Test');

    const expectedLog = createExpectedLogMessage();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessage, expectedLog);
    expect(res).to.be.true;
  });

  function createExpectedLogMessage(): EventFetcherLogEntryMessage {
    return {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
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
      actualLog.amount === expectedLog.amount
    );
  }

  function initalizeMocks() {
    logger = new LoggerAdapter('local_logger.txt');

    mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

    const newRelicApiUrl: string = process.env.NEW_RELIC_API_URL as string;
    mockNewRelic = new MockNewRelic(newRelicApiUrl, logger);
  }

  function setupNockInterceptors() {
    mockEthereumNodeResponses();
    mockNewRelicLogEndpoint();
  }

  function mockEthereumNodeResponses() {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber();
    mockEthereumNode.mockEventResponse('test/data/depositEvent.json');
  }

  function mockNewRelicLogEndpoint() {
    mockNewRelic.mockLogEndpoint();
  }

  function cleanupNock() {
    nock.cleanAll();
  }
});
