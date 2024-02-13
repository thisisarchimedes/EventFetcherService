import {Logger} from '@thisisarchimedes/backend-sdk';

import {expect} from 'chai';

import {LoggerPort} from '../ports/LoggerPort';
import {EventFetcherPort} from '../ports/EventFetcherPort';
import {ConfigServicePSPPort} from '../ports/ConfigServicePSPPort';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {OnChainEvent} from '../../src/onchain_events/OnChainEvent';
import { LogMessage } from '../../src/types/LogMessage';


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

    const onChainEvents: OnChainEvent[] = [];

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

    validateLogMessage(logger.getLastMessage(), expectedLogMessage);
  });

  function validateLogMessage(actualLogMessage: string, expectedLogMessage: LogMessage) {
    const logMessage = JSON.parse(actualLogMessage.split('INFO: ')[1]);

    expect(logMessage.event).to.equal(expectedLogMessage.event);
    expect(logMessage.user).to.equal(expectedLogMessage.user);
    expect(logMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(logMessage.amount).to.equal(expectedLogMessage.amount);
  }
});

