import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import dotenv from 'dotenv';
import {ConfigService} from './services/config/ConfigService';
import {EventFactory, EventFactoryUnknownEventError} from './onchain_events/EventFactory';
import {EventFetcherRPC} from './services/blockchain/EventFetcherRPC';
import {ALL_TOPICS} from './onchain_events/EventTopic';
import {EventFetcherMessage} from './types/EventFetcherMessage';
import {LedgerBuilder} from './LedgerBuilder';

dotenv.config();

export class EventProcessorService {
  private readonly logger: Logger;
  private readonly configService: ConfigService;
  private readonly eventFactory: EventFactory;
  private readonly ledgerBuilder: LedgerBuilder;

  private readonly eventFetcher;

  constructor(
      logger: Logger,
      configService: ConfigService,
  ) {
    this.logger = logger;
    this.configService = configService;
    this.eventFactory = new EventFactory(this.configService, this.logger);

    const mainRpcProvider = new ethers.JsonRpcProvider(configService.getMainRPCURL());
    const altRpcProvider = new ethers.JsonRpcProvider(configService.getAlternativeRPCURL());
    this.eventFetcher = new EventFetcherRPC(mainRpcProvider, altRpcProvider);
    this.ledgerBuilder = new LedgerBuilder(configService, this.logger, mainRpcProvider, altRpcProvider);
  }

  public async execute(): Promise<void> {
    try {
      this.logger.info('Executing the event fetcher workflow...');
      this.logger.info(`RPC: ${this.configService.getMainRPCURL()}\n
                        Env: ${this.configService.getEnvironment()}`);

      const startBlock = await this.getStartBlockNumber();
      const endBlock = await this.eventFetcher.getCurrentBlockNumber();

      await this.processEventsAtBlockRange(startBlock, endBlock);

      await this.configService.setLastScannedBlock(endBlock);

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

  private processLogGroup(eventLogGroup: ethers.Log[]): EventFetcherMessage[] {
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
    const MaxNumberOfBlocksToProess = this.configService.getMaxNumberOfBlocksToProcess();
    const currentBlockNumber = await this.eventFetcher.getCurrentBlockNumber();
    const defaultBlockNumber = Math.max(currentBlockNumber - MaxNumberOfBlocksToProess, 0);
    const lastBlockScanned = this.configService.getLastBlockScanned();

    if (lastBlockScanned == 0 ||
      currentBlockNumber - lastBlockScanned > MaxNumberOfBlocksToProess ||
      lastBlockScanned > currentBlockNumber) {
      return defaultBlockNumber;
    }

    return lastBlockScanned;
  }
}
