import dotenv from 'dotenv';
import {Logger} from '@thisisarchimedes/backend-sdk';
import {expect} from 'chai';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {EventFetcherLogEntryMessagePSP} from '../../src/types/NewRelicLogEntry';
import {OnChainEvent} from '../../src/onchain_events/OnChainEvent';

dotenv.config();

describe('PSP Events Logging', function() {
  let logger: LoggerAdapter;
  let eventFetcher: EventFetcherAdapter;
  let configService: ConfigServiceAdapter;
  let eventFactory: EventFactory;

  beforeEach(async function() {
    logger = new LoggerAdapter('local_logger.txt');
    eventFetcher = new EventFetcherAdapter();

    configService = new ConfigServiceAdapter();
    configService.setLeverageAddressesFile('test/data/leverageAddresses.json');
    configService.setPSPInfoFile('test/data/strategies.json');
    await configService.refreshConfig();

    eventFactory = new EventFactory(configService, logger as unknown as Logger);
  });

  it('should report on Deposit event', async function() {
    const strategyAddress = configService.getPSPContractAddressByStrategyName('Convex FRAXBP/msUSD Single Pool');
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json', strategyAddress);
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = await eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message.startsWith('Unknown strategy address')) {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal('Deposit');

    event.process();
    const expectedLogMessage: EventFetcherLogEntryMessagePSP = {
      blockNumber: 18742061,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amountAddedToStrategy: BigInt(5000000).toString(),
      amountAddedToAdapter: BigInt(0).toString(),
    };

    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });

  it('should report on Withdraw event', async function() {
    const strategyAddress = configService.getPSPContractAddressByStrategyName('Convex ETH+/ETH Single Pool');
    eventFetcher.setEventArrayFromFile('test/data/withdrawEvent.json', strategyAddress);
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
    const expectedLogMessage: EventFetcherLogEntryMessagePSP = {
      blockNumber: 18896084,
      txHash: '0x41f9437497aee519b2c3d1013fcb40b39447a3d969cc2ddc445a1bcdb49f7600',
      event: 'Withdraw',
      user: '0x2222222222222222222222222222222222222222',
      strategy: 'Convex ETH+/ETH Single Pool',
      amountAddedToStrategy: BigInt(-1n).toString(),
      amountAddedToAdapter: BigInt(0).toString(),
    };

    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);
  });


  function validateLogMessage(
      actualLogMessage: EventFetcherLogEntryMessagePSP,
      expectedLogMessage: EventFetcherLogEntryMessagePSP,
  ) {
    expect(actualLogMessage.blockNumber).to.equal(expectedLogMessage.blockNumber);
    expect(actualLogMessage.txHash).to.equal(expectedLogMessage.txHash);
    expect(actualLogMessage.event).to.equal(expectedLogMessage.event);
    expect(actualLogMessage.user).to.equal(expectedLogMessage.user);
    expect(actualLogMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(actualLogMessage.amountAddedToStrategy).to.equal(expectedLogMessage.amountAddedToStrategy);
    expect(actualLogMessage.amountAddedToAdapter).to.equal(expectedLogMessage.amountAddedToAdapter);
  }
});

