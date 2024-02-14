import fs from 'fs';
import {expect} from 'chai';
import nock from 'nock';

import {EventFetcherLogEntryMessage, NewRelicLogEntry} from '../../src/types/NewRelicLogEntry';
import {handler} from '../../src/runner';
import {ethers} from 'ethers';
import {LoggerAdapter} from '../adapters/LoggerAdapter';


describe('PSP Events', function() {
  const localLogger: LoggerAdapter = new LoggerAdapter('local_logger.txt');

  beforeEach(function() {
    const dataRaw = fs.readFileSync('test/data/depositEvent.json', 'utf8');
    const data: ethers.providers.Log[] = JSON.parse(dataRaw);


    nock.cleanAll();
    nock('http://ec2-52-4-114-208.compute-1.amazonaws.com:8545')
        .persist()
        .post('/', () => true)
        .reply(200, (uri, requestBody: nock.Body) => {
          // Handle based on the method in requestBody
          switch (requestBody['method']) {
            case 'eth_chainId':
              return {jsonrpc: '2.0', id: requestBody['id'], result: '0x1'};
            case 'eth_blockNumber':
              return {jsonrpc: '2.0', id: requestBody['id'], result: '0x5B8D80'};
            case 'eth_getLogs':
            // Provide a mock response specific to eth_getLogs
              return {jsonrpc: '2.0', id: requestBody['id'], result: data}; // Adjust based on expected result
            default:
              return {message: 'Unhandled method'};
          }
        });

    nock('https://log-api.newrelic.com')
        .persist()
        .post('/log/v1', () => true) // Match the exact path
        .reply(200, (uri, requestBody) => {
          localLogger.info(JSON.stringify(requestBody));


          return {};
        });
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it('should catch and report on Deposit event', async function() {
    await handler(0, 0);

    const expectedLogMessage: EventFetcherLogEntryMessage = {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
    };

    const logLines = localLogger.getLastSeveralMessagesRawStrings(3);
    let found: number = 0;
    for (let i = logLines.length - 1; i >= 0; i--) {
      const actualLogMessage: NewRelicLogEntry = JSON.parse(JSON.parse((logLines[i].split('INFO: ')[1])));

      try {
        const ret = JSON.parse(String(actualLogMessage.message)) as EventFetcherLogEntryMessage;
        if (validateLogMessage(ret, expectedLogMessage) == true) {
          found++;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    expect(found).to.eq(1);
  });

  function validateLogMessage(actualLogMessage: EventFetcherLogEntryMessage,
      expectedLogMessage: EventFetcherLogEntryMessage): boolean {
    if (!isLogMessageValid(actualLogMessage)) {
      return false;
    }

    const isEventValid = isFieldValid(actualLogMessage.event, expectedLogMessage.event);
    const isUserValid = isFieldValid(actualLogMessage.user, expectedLogMessage.user);
    const isStrategyValid = isFieldValid(actualLogMessage.strategy, expectedLogMessage.strategy);
    const isAmountValid = isFieldValid(actualLogMessage.amount, expectedLogMessage.amount);

    return isEventValid && isUserValid && isStrategyValid && isAmountValid;
  }

  function isLogMessageValid(logMessage: EventFetcherLogEntryMessage): boolean {
    return !!logMessage &&
      !!logMessage.event &&
      !!logMessage.user &&
      !!logMessage.strategy &&
      !!logMessage.amount;
  }

  function isFieldValid(actualValue: string, expectedValue: string): boolean {
    return actualValue === expectedValue;
  }
});

