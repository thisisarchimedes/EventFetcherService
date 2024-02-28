import {ethers} from 'ethers';
import {SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import dotenv from 'dotenv';
import {ConfigService} from './services/config/ConfigService';
import {EventFactory, EventFactoryUnknownEventError} from './onchain_events/EventFactory';
import {EventFetcherRPC} from './services/blockchain/EventFetcherRPC';
import {ALL_TOPICS} from './onchain_events/EventTopic';

dotenv.config();


export class EventProcessorService {
  private readonly logger: Logger;
  private readonly configService: ConfigService;
  private readonly eventFactory: EventFactory;

  private readonly sqsService: SQSService;
  private readonly eventFetcher;

  constructor(
      logger: Logger,
      configService: ConfigService,
  ) {
    this.sqsService = new SQSService();
    this.logger = logger;
    this.configService = configService;

    this.eventFactory = new EventFactory(this.configService, this.logger, this.sqsService);
    this.eventFetcher = new EventFetcherRPC(configService.getMainRPCURL(), configService.getAlternativeRPCURL());
  }

  public async execute(): Promise<void> {
    try {
      this.logger.info('Executing the event fetcher workflow...');
      this.logger.info(`RPC: ${this.configService.getMainRPCURL()}\n
                        SQS queue: ${this.configService.getEventQueueURL()}\n
                        Env: ${this.configService.getEnvironment()}`);

      const startBlock = await this.getStartBlockNumber();
      const endBlock = await this.eventFetcher.getCurrentBlockNumber();
      console.log('startBlock:', startBlock);
      console.log('endBlock:', endBlock);

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

  private async processEventsAtBlockRange(startBlock: number, endBlock: number): Promise<void> {
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

      await this.processLogGroup(eventLogGroup);
    }
  }

  private async processLogGroup(eventLogGroup: ethers.providers.Log[]): Promise<void> {
    for (const event of eventLogGroup) {
      try {
        const evt = await this.eventFactory.createEvent(event);
        evt.process();
      } catch (error) {
        if (error instanceof EventFactoryUnknownEventError) {
          continue;
        }
      }
    }
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
