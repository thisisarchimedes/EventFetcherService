import dotenv from 'dotenv';
import {ConfigService} from './services/config/ConfigService';
import {EventFactory, EventFactoryUnknownEventError} from './onchain_events/EventFactory';
import {EventFetcherRPC} from './services/blockchain/EventFetcherRPC';
import {ALL_TOPICS} from './onchain_events/EventTopic';
import {EventFetcherMessage} from './types/EventFetcherMessage';
import {LedgerBuilder} from './LedgerBuilder';
import {ethers} from 'ethers';
import {PrismaClient} from '@prisma/client';
import {MultiPoolStrategies} from './MultiPoolStrategies';
import MonitorTrackerService from './services/monitorTracker/MonitorTrackerService';
import MonitorTrackerStorage from './services/monitorTracker/MonitorTrackerStorage';
import {KMSFetcherService} from './services/kms/KMSFetcherService';
import {Logger} from './services/logger/Logger';

dotenv.config();

export class EventProcessorService {
  private readonly eventFactory: EventFactory;
  private readonly ledgerBuilder: LedgerBuilder;

  private readonly eventFetcher;

  private readonly monitorTrackerService: MonitorTrackerService;

  constructor(
      private readonly logger: Logger,
      private readonly configService: ConfigService,
      prisma: PrismaClient,
      mainRpcProvider: ethers.providers.JsonRpcProvider,
      altRpcProvider: ethers.providers.JsonRpcProvider,
  ) {
    this.logger = logger;
    this.configService = configService;
    this.eventFactory = new EventFactory(this.configService, this.logger);

    const multiPoolStrategies = new MultiPoolStrategies(mainRpcProvider);
    this.eventFetcher = new EventFetcherRPC(mainRpcProvider, altRpcProvider);
    this.ledgerBuilder = new LedgerBuilder(this.logger, mainRpcProvider, altRpcProvider, prisma, multiPoolStrategies);

    const monitorTrackerStorage = new MonitorTrackerStorage(prisma);
    const kmsFetcherService = new KMSFetcherService();

    this.monitorTrackerService = new MonitorTrackerService(
        logger, configService, this.eventFetcher, monitorTrackerStorage, kmsFetcherService);
  }

  public async execute(): Promise<void> {
    try {
      this.logger.info('Executing the event fetcher workflow...');
      this.logger.info(`Env: ${this.configService.getEnvironment()} - RPC: ${this.configService.getMainRPCURL()}`);
      const startBlock = await this.getStartBlockNumber();
      const endBlock = await this.eventFetcher.getCurrentBlockNumber();

      const events = await this.processEventsAtBlockRange(startBlock, endBlock);
      await this.ledgerBuilder.processEvents(events);

      await this.configService.setLastScannedBlock(endBlock);

      await this.monitorTrackerService.updateEthBalances();

      this.logger.info('Event fetcher workflow completed.');
    } catch (error) {
      this.logger.error(`Error in event fetcher workflow: ${error}`);
      console.error('Error in event fetcher workflow:', error);
    } finally {
      await this.logger.flush();
    }
  }

  private async processEventsAtBlockRange(startBlock: number, endBlock: number): Promise<EventFetcherMessage[]> {
    let events: EventFetcherMessage[] = [];

    for (
      let currentStepStartBlock = startBlock + 1;
      currentStepStartBlock <= endBlock;
      currentStepStartBlock += this.configService.getEventsFetchPageSize()
    ) {
      const currentStepEndBlock = Math.min(
          currentStepStartBlock + this.configService.getEventsFetchPageSize() - 1,
          endBlock,
      );

      const eventLogGroup = await this.eventFetcher.getOnChainEvents(
          currentStepStartBlock,
          currentStepEndBlock,
          ALL_TOPICS,
      );

      events = [
        ...events,
        ...this.processLogGroup(eventLogGroup),
      ];
    }

    return events;
  }

  private processLogGroup(eventLogGroup: ethers.providers.Log[]): EventFetcherMessage[] {
    const events: EventFetcherMessage[] = [];

    for (const eventLog of eventLogGroup) {
      try {
        const evt = this.eventFactory.createEvent(eventLog);
        const event = evt.process();
        if (event) {
          events.push(event);
        }
      } catch (error) {
        if (error instanceof EventFactoryUnknownEventError) {
          continue;
        }
      }
    }

    return events;
  }

  private async getStartBlockNumber(): Promise<number> {
    const MaxNumberOfBlocksToProcess = this.configService.getMaxNumberOfBlocksToProcess();
    const currentBlockNumber = await this.eventFetcher.getCurrentBlockNumber();
    const defaultBlockNumber = Math.max(currentBlockNumber - MaxNumberOfBlocksToProcess, 0);
    const lastBlockScanned = this.configService.getLastBlockScanned();

    if (lastBlockScanned == 0 ||
      currentBlockNumber - lastBlockScanned > MaxNumberOfBlocksToProcess ||
      lastBlockScanned > currentBlockNumber) {
      return defaultBlockNumber;
    }

    return lastBlockScanned;
  }
}
