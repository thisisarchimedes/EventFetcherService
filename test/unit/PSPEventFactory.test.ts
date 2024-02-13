import {Logger} from '@thisisarchimedes/backend-sdk';

import {expect} from 'chai';

import {LoggerPort} from '../ports/LoggerPort';
import {EventFetcherPort} from '../ports/EventFetcherPort';
import {ConfigServicePSPPort} from '../ports/ConfigServicePSPPort';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {OnChainEventPSP} from '../../src/onchain_events/OnChainEventPSP';
import {LogMessage} from '../../src/types/LogMessage';


describe('PSP Events Logging', function() {
  let logger: LoggerPort;
  let eventFetcher: EventFetcherPort;
  let configService: ConfigServicePSPPort;
  let eventFactory: EventFactory;

  beforeEach(async function() {
    logger = new LoggerPort('local_logger.txt');
    eventFetcher = new EventFetcherPort();
    configService = new ConfigServicePSPPort('test/data/strategies.json');
    await configService.refreshStrategyConfig();

    eventFactory = new EventFactory(configService, logger as unknown as Logger);
  });

  it('should report on Deposit event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEventPSP[] = [];

    for (const event of eventsLog) {
      try {
        const evt = eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown strategy address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    onChainEvents[0].process();

    const expectedLogMessage = {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
    };

    const actualLogMessage = JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]);
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });

  it('should report on Withdraw event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/withdrawEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEventPSP[] = [];

    for (const event of eventsLog) {
      try {
        const evt = eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown strategy address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    onChainEvents[0].process();

    const expectedLogMessage = {
      event: 'Withdraw',
      user: '0x5B63D628f307042BF9F28aB5C867f89ee231Ef58',
      strategy: 'Convex ETH+/ETH Single Pool',
      amount: '8989886520688963896',
    };

    const actualLogMessage = JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]);
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });


  function validateLogMessage(actualLogMessage: LogMessage, expectedLogMessage: LogMessage) {
    expect(actualLogMessage.event).to.equal(expectedLogMessage.event);
    expect(actualLogMessage.user).to.equal(expectedLogMessage.user);
    expect(actualLogMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(actualLogMessage.amount).to.equal(expectedLogMessage.amount);
  }
});

