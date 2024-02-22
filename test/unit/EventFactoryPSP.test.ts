import {Logger} from '@thisisarchimedes/backend-sdk';

import {expect} from 'chai';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {SQSServiceAdapter} from '../adapters/SQSServiceAdapter';
import {OnChainEvent} from '../../src/onchain_events/OnChainEvent';


describe('PSP Events Logging', function() {
  let logger: LoggerAdapter;
  let eventFetcher: EventFetcherAdapter;
  let configService: ConfigServiceAdapter;
  let eventFactory: EventFactory;
  let sqsService: SQSServiceAdapter;

  beforeEach(async function() {
    logger = new LoggerAdapter('local_logger.txt');
    eventFetcher = new EventFetcherAdapter();
    sqsService = new SQSServiceAdapter();

    configService = new ConfigServiceAdapter();
    configService.setLeverageAddressesFile('test/data/leverageAddresses.json');
    configService.setPSPInfoFile('test/data/strategies.json');
    await configService.refreshConfig();

    eventFactory = new EventFactory(configService, logger as unknown as Logger, sqsService);
  });

  it('should report on Deposit event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = await eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown strategy address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal('Deposit');

    event.process();
    const expectedLogMessage: EventFetcherLogEntryMessage = {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      depositAmount: '5000000',
    };

    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });

  it('should report on Withdraw event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/withdrawEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = await eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown strategy address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal('Withdraw');

    event.process();
    const expectedLogMessage: EventFetcherLogEntryMessage = {
      event: 'Withdraw',
      user: '0x5B63D628f307042BF9F28aB5C867f89ee231Ef58',
      strategy: 'Convex ETH+/ETH Single Pool',
      depositAmount: '8989886520688963896',
    };

    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });


  function validateLogMessage(
      actualLogMessage: EventFetcherLogEntryMessage,
      expectedLogMessage: EventFetcherLogEntryMessage,
  ) {
    expect(actualLogMessage.event).to.equal(expectedLogMessage.event);
    expect(actualLogMessage.user).to.equal(expectedLogMessage.user);
    expect(actualLogMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(actualLogMessage.depositAmount).to.equal(expectedLogMessage.depositAmount);
  }
});

