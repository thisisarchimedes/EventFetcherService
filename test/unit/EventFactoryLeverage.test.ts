import {Logger} from '@thisisarchimedes/backend-sdk';
import {expect} from 'chai';

import {LoggerAdapter} from '../adapters/LoggerAdapter';
import {EventFetcherAdapter} from '../adapters/EventFetcherAdapter';
import {ConfigServiceAdapter} from '../adapters/ConfigServiceAdapter';

import {EventFactory} from '../../src/onchain_events/EventFactory';
import {
  EventFetcherLogEntryMessageLeverage,
  EventSpecificDataLeveragePositionLiquidated,
  EventSpecificDataLeveragePositionOpened,
} from '../../src/types/NewRelicLogEntry';
import {SQSServiceAdapter} from '../adapters/SQSServiceAdapter';
import {OnChainEvent} from '../../src/onchain_events/OnChainEvent';
import {EventFetcherSQSMessage} from '../../src/types/EventFetcherSQSMessage';

describe('Leverage Events Logging & Queuing', function() {
  let logger: LoggerAdapter;
  let eventFetcher: EventFetcherAdapter;
  let configService: ConfigServiceAdapter;
  let eventFactory: EventFactory;
  let sqsService: SQSServiceAdapter;

  const LOCAL_LOGGER: string = 'local_logger.txt';
  const LEVERAGE_ADDRESS_FILE: string = 'test/data/leverageAddresses.json';
  const PSP_INFO_FILE: string = 'test/data/strategies.json';

  beforeEach(async function() {
    setupTestEnvironment();
    await loadConfiguration();
  });

  it('should report on PositionOpened event', async function() {
    const eventSyntheticDataFileName: string = 'test/data/leveragePositionOpenedEvent.json';
    const expectedEventName: string = 'LeveragedPositionOpened';

    const eventSpecificDetails: EventSpecificDataLeveragePositionOpened = {
      positionExpireBlock: '3',
      sharesReceived: '4',
    };
    const expectedLogMessage: EventFetcherLogEntryMessageLeverage = {
      nftID: 2,
      blockNumber: 6000003,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'LeveragedPositionOpened',
      user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      collateralAddedToStrategy: BigInt(1).toString(),
      debtBorrowedFromProtocol: BigInt(2).toString(),
      eventSpecificData: eventSpecificDetails,
    };

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

    const event: OnChainEvent = await testEventGeneration(
        eventSyntheticDataFileName,
        expectedEventName,
        configService.getLeveragePositionOpenerAddress(),
    );
    testEventProcessing(event, expectedLogMessage, expectedSqsMessage);
  });

  it('should report on PositionClosed event', async function() {
    const eventSyntheticDataFileName: string = 'test/data/leveragePositionClosedEvent.json';
    const expectedEventName: string = 'LeveragedPositionClosed';

    const expectedLogMessage: EventFetcherLogEntryMessageLeverage = {
      nftID: 2,
      blockNumber: 6000003,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'LeveragedPositionClosed',
      user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      collateralAddedToStrategy: BigInt(-1n).toString(),
      debtBorrowedFromProtocol: (BigInt(2) * -1n).toString(),
    };

    const expectedSqsMessage: EventFetcherSQSMessage = {
      name: 'PositionClosed',
      contractType: 1,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      blockNumber: 6000003,
      data: {
        nftId: 2,
        user: '0x925cc02EC7b77d4432e82e7bCaf3B89a67a555F2',
        receivedAmount: '1',
        wbtcDebtAmount: '2',
      },
    };

    const event: OnChainEvent = await testEventGeneration(
        eventSyntheticDataFileName,
        expectedEventName,
        configService.getLeveragePositionCloserAddress(),
    );
    testEventProcessing(event, expectedLogMessage, expectedSqsMessage);
  });

  it('should report on PositionLiqiuidated event', async function() {
    const eventSyntheticDataFileName: string = 'test/data/leveragePositionLiquidatedEvent.json';
    const expectedEventName: string = 'LeveragedPositionLiquidated';

    const eventSpecificDetails: EventSpecificDataLeveragePositionLiquidated = {
      liquidationFee: BigInt(3).toString(),
    };

    const expectedLogMessage: EventFetcherLogEntryMessageLeverage = {
      nftID: 2,
      blockNumber: 6000003,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'LeveragedPositionLiquidated',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      collateralAddedToStrategy: (BigInt(2) * -1n).toString(),
      debtBorrowedFromProtocol: (BigInt(1) * -1n).toString(),
      eventSpecificData: eventSpecificDetails,
    };

    const expectedSqsMessage: EventFetcherSQSMessage = {
      name: 'PositionLiquidated',
      contractType: 2,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      blockNumber: 6000003,
      data: {
        nftId: 2,
        strategy: '0x825cc02ec7B77d4432e82e7bCAf3B89a67a555F1',
        wbtcDebtPaid: '1',
        claimableAmount: '2',
        liquidationFee: '3',
      },
    };

    const event: OnChainEvent = await testEventGeneration(
        eventSyntheticDataFileName,
        expectedEventName,
        configService.getLeveragePositionLiquidatorAddress(),
    );
    testEventProcessing(event, expectedLogMessage, expectedSqsMessage);
  });

  it('should report on PositionExpired event', async function() {
    const eventSyntheticDataFileName: string = 'test/data/leveragePositionExpiredEvent.json';
    const expectedEventName: string = 'LeveragedPositionExpired';

    const expectedLogMessage: EventFetcherLogEntryMessageLeverage = {
      nftID: 2,
      blockNumber: 6000003,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      event: 'LeveragedPositionExpired',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      debtBorrowedFromProtocol: (BigInt(1) * -1n).toString(),
      collateralAddedToStrategy: (BigInt(2) * -1n).toString(),
    };

    const expectedSqsMessage: EventFetcherSQSMessage = {
      name: 'PositionExpired',
      contractType: 3,
      txHash: '0x1fe52317d52b452120708667eed57e3c19ad39268bfabcf60230978c50df426f',
      blockNumber: 6000003,
      data: {
        nftId: 2,
        user: '',
        claimableAmount: '2',
      },
    };

    const event: OnChainEvent = await testEventGeneration(
        eventSyntheticDataFileName,
        expectedEventName,
        configService.getLeveragePositionExpiratorAddress(),
    );
    testEventProcessing(event, expectedLogMessage, expectedSqsMessage);
  });


  function setupTestEnvironment() {
    logger = new LoggerAdapter(LOCAL_LOGGER);
    eventFetcher = new EventFetcherAdapter();
    sqsService = new SQSServiceAdapter();
    configService = new ConfigServiceAdapter();
  }

  async function loadConfiguration() {
    configService.setLeverageAddressesFile(LEVERAGE_ADDRESS_FILE);
    configService.setPSPInfoFile(PSP_INFO_FILE);
    await configService.refreshConfig();
    eventFactory = new EventFactory(configService, logger as unknown as Logger, sqsService);
  }

  async function testEventGeneration(
      eventFileName: string,
      expetedEventName: string,
      contractAddress: string,
  ): Promise<OnChainEvent> {
    eventFetcher.setEventArrayFromFile(eventFileName, contractAddress);
    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];
    for (const event of eventsLog) {
      try {
        const evt = await eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        console.log(e);
        if (e.message === 'Unknown contract address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    const event: OnChainEvent = onChainEvents[0];
    expect(event.getEventName()).to.equal(expetedEventName);

    return event;
  }

  function testEventProcessing(
      event: OnChainEvent,
      expectedLogMessage: EventFetcherLogEntryMessageLeverage,
      expectedSqsMessage: EventFetcherSQSMessage,
  ) {
    event.process();

    const actualLogMessage = JSON.parse(JSON.parse(logger.getLastMessageRawString().split('INFO: ')[1]));
    validateLogMessage(actualLogMessage, expectedLogMessage);

    const actualSqsMessage = JSON.parse(sqsService.getLatestMessage());
    validateSQSMessage(actualSqsMessage, expectedSqsMessage);
  }

  function validateLogMessage(
      actualLogMessage: EventFetcherLogEntryMessageLeverage,
      expectedLogMessage: EventFetcherLogEntryMessageLeverage,
  ) {
    expect(actualLogMessage.blockNumber).to.equal(expectedLogMessage.blockNumber);
    expect(actualLogMessage.txHash).to.equal(expectedLogMessage.txHash);
    expect(actualLogMessage.event).to.equal(expectedLogMessage.event);
    expect(actualLogMessage.user).to.equal(expectedLogMessage.user);
    expect(actualLogMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(actualLogMessage.nftID).to.equal(expectedLogMessage.nftID);
    expect(actualLogMessage.collateralAddedToStrategy).to.equal(expectedLogMessage.collateralAddedToStrategy);
    expect(actualLogMessage.debtBorrowedFromProtocol).to.equal(expectedLogMessage.debtBorrowedFromProtocol);
    expect(JSON.stringify(actualLogMessage.eventSpecificData))
        .to.equal(JSON.stringify(expectedLogMessage.eventSpecificData));
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

