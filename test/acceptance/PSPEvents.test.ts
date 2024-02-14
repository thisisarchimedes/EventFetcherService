import {expect} from 'chai';
import nock from 'nock';
import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/runner';

import {MockEthereumNode} from './MockEthereumNode';
import {MockNewRelic} from './MockNewRelic';

describe('PSP Events', function() {
  const logger = new LoggerAdapter('local_logger.txt');
  const mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');
  const mockNewRelic = new MockNewRelic('https://log-api.newrelic.com', logger);

  beforeEach(setupNockInterceptors);
  afterEach(cleanupNock);

  it('should catch and report on Deposit event', async function() {
    await handler(0, 0);

    const expectedLog = createExpectedLogMessage();
    const actualLog = mockNewRelic.findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res: boolean = validateLogMessage(actualLog as EventFetcherLogEntryMessage, expectedLog);
    expect(res).to.be.true;
  });

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

  function setupNockInterceptors() {
    mockEthereumNodeResponses();
    mockNewRelicLogEndpoint();
  }

  function cleanupNock() {
    nock.cleanAll();
  }

  function mockEthereumNodeResponses() {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber();
    mockEthereumNode.mockEventResponse('test/data/depositEvent.json');
  }

  function mockNewRelicLogEndpoint() {
    mockNewRelic.mockLogEndpoint();
  }

  function createExpectedLogMessage(): EventFetcherLogEntryMessage {
    return {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
    };
  }
});
