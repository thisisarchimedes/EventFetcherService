import {expect} from 'chai';
import nock from 'nock';
import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherLogEntryMessage, NewRelicLogEntry} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/runner';

import {MockEthereumNode} from './MockEthereumNode';

describe('PSP Events', function() {
  const logger = new LoggerAdapter('local_logger.txt');
  const mockEthereumNode = new MockEthereumNode('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545');

  beforeEach(setupNockInterceptors);
  afterEach(cleanupNock);

  it('should catch and report on Deposit event', async function() {
    await handler(0, 0);

    const expectedLog = createExpectedLogMessage();
    const actualLog = findMatchingLogEntry(logger);

    expect(actualLog).to.not.be.null;
    const res = validateLogMessage(actualLog as EventFetcherLogEntryMessage, expectedLog);
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
    mockEthereumNode.cleanup();
  }

  function mockEthereumNodeResponses() {
    mockEthereumNode.mockChainId();
    mockEthereumNode.mockBlockNumber();
    mockEthereumNode.mockEventResponse('test/data/depositEvent.json'); // Specify the event name here
  }

  function mockNewRelicLogEndpoint() {
    nock('https://log-api.newrelic.com')
        .persist()
        .post('/log/v1', () => true)
        .reply(200, (_, requestBody) => {
          logger.info(JSON.stringify(requestBody));
          return {};
        });
  }

  function createExpectedLogMessage(): EventFetcherLogEntryMessage {
    return {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
    };
  }

  function findMatchingLogEntry(logger: LoggerAdapter): EventFetcherLogEntryMessage | null {
    const logLines = logger.getLastSeveralMessagesRawStrings(3);

    for (let i = logLines.length - 1; i >= 0; i--) {
      const logEntry = parseLogEntry(logLines[i]);
      if (logEntry == null) {
        continue;
      }
      return logEntry;
    }

    return null;
  }

  function parseLogEntry(logLine: string): EventFetcherLogEntryMessage | null {
    try {
      const logEntry: NewRelicLogEntry = JSON.parse(JSON.parse(logLine.split('INFO: ')[1]));
      return JSON.parse(String(logEntry.message));
    } catch (error) {
      return null;
    }
  }
});
