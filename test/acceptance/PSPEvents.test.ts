import fs from 'fs';
import {expect} from 'chai';
import nock from 'nock';

import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
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
        .post('/', (body) => true)
        .reply(200, (uri, requestBody: nock.Body) => {
        // console.log('Intercepted request to:', uri, ' -> body:', JSON.stringify(requestBody));

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
        .post('/log/v1', (body) => true) // Match the exact path
        .reply(200, (uri, requestBody) => {
        // console.log('LOG: Intercepted request to New Relic:', uri, ' -> body:', requestBody);
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
      console.log(`*** ${i} ***`);
      console.log('logLines[i]', logLines[i].split('INFO: ')[1]);
      const actualLogMessage: LogEntry = JSON.parse((logLines[i].split('INFO: ')[1]));

      console.log('parsed', actualLogMessage);
      //    const messageObject = JSON.parse(actualLogMessage.message);
      const parsedMessage = JSON.parse(actualLogMessage);
      console.log('parsed 2: ', parsedMessage);
      console.log('parsed 3:', parsedMessage.message);

      //      console.log('parsed - messageObject', messageObject);


      console.log(i, ' - actualLogMessage:', parsedMessage.message);
      try {
        const ret = JSON.parse(parsedMessage.message) as EventFetcherLogEntryMessage;
        if (validateLogMessage(ret, expectedLogMessage) == true) {
          found++;
          break;
        }
      } catch (error) {
        console.error('Error parsing JSON from log:', parsedMessage.message, error);
      }
    }

    expect(found).to.eq(1);
  });

  function validateLogMessage(actualLogMessage: EventFetcherLogEntryMessage, expectedLogMessage: EventFetcherLogEntryMessage): boolean {
    if (!actualLogMessage ||
      !actualLogMessage.event ||
      !actualLogMessage.user ||
      !actualLogMessage.strategy ||
      !actualLogMessage.amount) {
      return false;
    }

    console.log('Actual Event:', actualLogMessage.event);
    console.log('Expected Event:', expectedLogMessage.event);

    console.log('Actual User:', actualLogMessage.user);
    console.log('Expected User:', expectedLogMessage.user);

    console.log('Actual Strategy:', actualLogMessage.strategy);
    console.log('Expected Strategy:', expectedLogMessage.strategy);

    console.log('Actual Amount:', actualLogMessage.amount);
    console.log('Expected Amount:', expectedLogMessage.amount);

    const isEventValid = actualLogMessage.event === expectedLogMessage.event;
    const isUserValid = actualLogMessage.user === expectedLogMessage.user;
    const isStrategyValid = actualLogMessage.strategy === expectedLogMessage.strategy;
    const isAmountValid = actualLogMessage.amount === expectedLogMessage.amount;

    return isEventValid && isUserValid && isStrategyValid && isAmountValid;
  }
});

