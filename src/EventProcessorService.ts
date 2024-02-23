import {ethers} from 'ethers';
import rawEventDescriptors from './events.json';
import {SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import dotenv from 'dotenv';
import {
  ContractType,
  DecodedData,
  EventDescriptor,
} from './types/EventDescriptor';
import {SQSMessage} from './types/SQSMessage';
import {EventData} from './types/EventData';
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
  // ////////////////////////////////////////////////////////////
/*
  private async processAndQueueLeverageEvents(lastBlock: number, currentBlock: number) {
    const events: SQSMessage[] = await this.fetchAndProcessEvents(lastBlock, currentBlock);

    if (events.length > 0) {
      this.logger.info(
          `Fetched ${events.length} events from blocks ${lastBlock} to ${currentBlock}`,
      );

      await this.queueEvents(events);
    } else {
      this.logger.info(
          `No new events found on blocks ${lastBlock} to ${currentBlock}`,
      );
    }
  }

  private async processPSPEvents(lastBlock: number, currentBlock: number) {
    const eventFetcher = new EventFetcherRPC(this.configService.getMainRPCURL(),
        this.configService.getAlternativeRPCURL());
    const eventsLog = await eventFetcher.getOnChainEvents(lastBlock, currentBlock);

    for (const event of eventsLog) {
      try {
        const evt = await this.eventFactory.createEvent(event);
        evt.process();
      } catch (e) {
        if ((e as Error).message === 'Unknown strategy address') {
          continue;
        }
      }
    }
  }


  public decodeAndProcessLogs(
      logs: ethers.providers.Log[],
      descriptor: EventDescriptor,
  ): SQSMessage[] {
    const logRes = logs
        .map((log) => {
          const indexedTypes = descriptor.decodeData
              .filter((param: DecodedData) => param.indexed)
              .map((param: DecodedData) => param.type);


          const nonIndexedTypes = descriptor.decodeData
              .filter((param: DecodedData) => !param.indexed)
              .map((param: DecodedData) => param.type);

          try {
          // Decode non-indexed parameters from: log.data
            const nonIndexedData = ethers.utils.defaultAbiCoder.decode(
                nonIndexedTypes,
                log.data,
            );

            // Decode indexed parameters from: log.topics
            const indexedData: ethers.utils.Result[] = indexedTypes.map(
                (type: string, index: number) => {
                  const topic = log.topics[index + 1];
                  return ethers.utils.defaultAbiCoder.decode([type], topic)[0];
                },
            );

            // Merge both indexed and non-indexed data
            const allData: ethers.utils.Result[] = [
              ...indexedData,
              ...nonIndexedData,
            ];


            const eventData: EventData = {};
            descriptor.decodeData.forEach((param: DecodedData, index: number) => {
              eventData[param.name] = allData[index].toString();
            });

            const retObj: SQSMessage = {
              name: descriptor.name,
              contractType: descriptor.contractType,
              txHash: log.transactionHash,
              blockNumber: log.blockNumber,
              data: eventData,
            };


            return retObj;
          } catch (error) {
            this.logger.error(`Failed to decode log: ${JSON.stringify(error)}`);
            return null;
          }
        })
        .filter((event): event is SQSMessage => event !== null);

    return logRes;
  }

  private async fetchAndProcessEvents(
      fromBlock: number,
      toBlock: number,
  ): Promise<SQSMessage[]> {
    const processedEvents: SQSMessage[] = [];
    for (
      let startBlock = fromBlock + 1;
      startBlock <= toBlock;
      startBlock += this.configService.getEventsFetchPageSize()
    ) {
      const endBlock = Math.min(
          startBlock + this.configService.getEventsFetchPageSize() - 1,
          toBlock,
      );
      for (const descriptor of this.EVENT_DESCRIPTORS) {
        let filter = {};

        let contractAddress: string = '';
        switch (descriptor.contractType) {
          case ContractType.Opener:
            contractAddress = this.configService.getLeveragePositionOpenerAddress();
            break;
          case ContractType.Closer:
            contractAddress = this.configService.getLeveragePositionCloserAddress();
            break;
          case ContractType.Liquidator:
            contractAddress = this.configService.getLeveragePositionLiquidatorAddress();
            break;
          case ContractType.Expirator:
            contractAddress = this.configService.getLeveragePositionExpiratorAddress();
            break;
        }

        if (contractAddress.length == 0) continue;

        filter = {
          address: contractAddress,
          topics: [descriptor.signature],
          fromBlock: startBlock,
          toBlock: endBlock + 5,
        };

        const fetchedLogs = await this.fetchLogsFromProviders(filter);
        const uniqueLogs = this.deduplicateLogs(fetchedLogs);
        const processedLogs = this.decodeAndProcessLogs(uniqueLogs, descriptor);

        processedEvents.push(...processedLogs);
      }
    }


    return processedEvents;
  }

  private async queueEvents(events: SQSMessage[]): Promise<void> {
    for (const event of events) {
      this.logger.info(
          `Appending message to queue ${this.configService.getEventQueueURL()
          }\n msg ${JSON.stringify(event)}`,
      );
      try {
        await this.sqsService.sendMessage(
            this.configService.getEventQueueURL(),
            JSON.stringify(event),
        );
      } catch (error) {
        // Catching InvalidChecksumError to allow acceptance test to mock the flow
        // without calculating the response checksum
        if (error == 'Error: InvalidChecksumError') {
          this.logger.error(`Failed to send message to queue: ${error}`);
        } else {
          throw error;
        }
      }
    }
  }
}
*/