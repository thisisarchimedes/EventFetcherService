import {Logger} from '@thisisarchimedes/backend-sdk';
import {expect} from 'chai';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {EventFetcherLogEntryMessage} from '../../src/types/NewRelicLogEntry';
import {SQSServiceAdapter} from '../adapters/SQSServiceAdapter';
import {OnChainEvent} from '../../src/onchain_events/OnChainEvent';
import {SQSMessage as EventFetcherSQSMessage} from '../../src/types/SQSMessage';
import {SQS} from 'aws-sdk';


describe('Leverage Events Logging & Queuing', function() {
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

  it('should report on PositionOpened event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/leveragePositionOpenedEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown contract address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal('LeveragedPositionOpened');

    event.process();

    const expectedLogMessage: EventFetcherLogEntryMessage = {
      event: 'LeveragedPositionOpened',
      user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      depositAmount: '1',
      borrowedAmount: '2',
    };
    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);

    const expectedSqsMessage: EventFetcherSQSMessage = {
      name: 'PositionOpened',
      contractType: 0,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      blockNumber: 6000003,
      data: {
        nftId: 2,
        user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
        strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
        collateralAmount: '1',
        wbtcToBorrow: '2',
        positionExpireBlock: '3',
        sharesReceived: '4',
      },
    };
    const actualSqsMessage = JSON.parse(sqsService.getLatestMessage());
    validateSQSMessage(actualSqsMessage, expectedSqsMessage);
  });

  it('should report on PositionClosed event', async function() {
    eventFetcher.setEventArrayFromFile('test/data/leveragePositionClosedEvent.json');
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown contract address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal('LeveragedPositionClosed');

    event.process();

    const expectedLogMessage: EventFetcherLogEntryMessage = {
      event: 'LeveragedPositionClosed',
      user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      depositAmount: '1',
      borrowedAmount: '2',
    };
    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);

    const expectedSqsMessage: EventFetcherSQSMessage = {
      name: 'PositionClosed',
      contractType: 1,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      blockNumber: 6000003,
      data: {
        nftId: 2,
        user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
        strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
        collateralAmount: '1',
        wbtcToBorrow: '2',
        positionExpireBlock: '',
        sharesReceived: '',
      },
    };
    const actualSqsMessage = JSON.parse(sqsService.getLatestMessage());
    validateSQSMessage(actualSqsMessage, expectedSqsMessage);
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

  function validateSQSMessage(
      actualLogMessage: EventFetcherSQSMessage,
      expectedLogMessage: EventFetcherSQSMessage,
  ) {
    expect(actualLogMessage.blockNumber).to.equal(expectedLogMessage.blockNumber);
    expect(actualLogMessage.contractType).to.equal(expectedLogMessage.contractType);
    expect(JSON.stringify(actualLogMessage.data)).to.equal(JSON.stringify(expectedLogMessage.data));
    expect(actualLogMessage.name).to.equal(expectedLogMessage.name);
    expect(actualLogMessage.txHash).to.equal(expectedLogMessage.txHash);
  }
});

