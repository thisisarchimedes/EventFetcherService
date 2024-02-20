import {ethers} from 'ethers';
import rawEventDescriptors from './events.json';
import {SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import dotenv from 'dotenv';
import {IEventProcessorService} from './IEventProcessorService';
import {
  ContractType,
  DecodedData,
  EventDescriptor,
} from './types/EventDescriptor';
import {ProcessedEvent} from './types/ProcessedEvent';
import {EventData} from './types/EventData';
import {ConfigService} from './services/config/ConfigService';
import {EventFactory} from './onchain_events/EventFactory';
import {EventFetcherRPC} from './services/blockchain/EventFetcherRPC';

dotenv.config();

const EVENT_DESCRIPTORS: EventDescriptor[] = rawEventDescriptors.map((event) => {
  const obj: EventDescriptor = {
    ...event,
    signature: ethers.utils.id(
        `${event.name}(${event.decodeData.map((param) => param.type).join(',')})`,
    ),
    contractType: event.contractType,
  };

  return obj;
});

export class EventProcessorService implements IEventProcessorService {
  private readonly EVENT_DESCRIPTORS = EVENT_DESCRIPTORS;
  private readonly logger: Logger;
  private readonly configService: ConfigService;

  private readonly eventFactory: EventFactory;
  private readonly mainProvider: ethers.providers.Provider;
  private readonly altProvider: ethers.providers.Provider;

  private readonly sqsService: SQSService;

  constructor(
      logger: Logger,
      configService: ConfigService,
  ) {
    this.logger = logger;
    this.configService = configService;
    this.eventFactory = new EventFactory(this.configService, this.logger);

    this.sqsService = new SQSService();

    console.log('----', configService);
    this.mainProvider = new ethers.providers.JsonRpcProvider(
        configService.getMainRPCURL(),
    );
    this.altProvider = new ethers.providers.JsonRpcProvider(
        configService.getAlternativeRPCURL(),
    );
  }

  public async execute(): Promise<void> {
    console.log('0 - execute: Executing the event fetcher workflow...');
    try {
      this.logger.info('Executing the event fetcher workflow...');
      this.logger.info(`RPC: ${this.configService.getMainRPCURL()}\n
                        SQS queue: ${this.configService.getEventQueueURL()}\n
                        Env: ${this.configService.getEnvironment()}`);

      console.log(`1 - RPC: ${this.configService.getMainRPCURL()}\n
      SQS queue: ${this.configService.getEventQueueURL()}\n
      Env: ${this.configService.getEnvironment()}`);
      const startBlock = await this.getStartBlockNumber();
      const endBlock = await this.getEndBlockNumber();
      console.log('1 - execute: startBlock', startBlock);
      console.log('2 - execute: endBlock', endBlock);

      await this.processAndQueueLeverageEvents(startBlock, endBlock);
      await this.processPSPEvents(startBlock, endBlock);

      await this.configService.setLastScannedBlock(endBlock);

      this.logger.info('Event fetcher workflow completed.');
    } catch (error) {
      this.logger.error(`Error in event fetcher workflow: ${error}`);
      console.error('Error in event fetcher workflow:', error);
    } finally {
      await this.logger.flush();
    }
  }

  private async processAndQueueLeverageEvents(lastBlock: number, currentBlock: number) {
    const events: ProcessedEvent[] = await this.fetchAndProcessEvents(lastBlock, currentBlock);

    console.log('1 - processAndQueueLeverageEvents: events', events);
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
        const evt = this.eventFactory.createEvent(event);
        evt.process();
      } catch (e) {
        if ((e as Error).message === 'Unknown strategy address') {
          continue;
        }
      }
    }
  }

  private async getEndBlockNumber(): Promise<number> {
    const [alchemyBlock, infuraBlock] = await Promise.all([
      this.mainProvider.getBlockNumber(),
      this.altProvider.getBlockNumber(),
    ]);
    return Math.min(alchemyBlock, infuraBlock);
  }

  private async fetchLogsFromProviders(
      filter: ethers.providers.Filter,
  ): Promise<ethers.providers.Log[]> {
    const [alchemyLogs, infuraLogs] = await Promise.all([
      this.mainProvider.getLogs(filter),
      this.altProvider.getLogs(filter),
    ]);

    return [...alchemyLogs, ...infuraLogs];
  }

  public deduplicateLogs(logs: ethers.providers.Log[]): ethers.providers.Log[] {
    const uniqueLogs = new Map<string, ethers.providers.Log>();

    for (const log of logs) {
      const uniqueKey = log.transactionHash + log.logIndex;
      if (!uniqueLogs.has(uniqueKey)) {
        uniqueLogs.set(uniqueKey, log);
      }
    }

    return Array.from(uniqueLogs.values());
  }

  public decodeAndProcessLogs(
      logs: ethers.providers.Log[],
      descriptor: EventDescriptor,
  ): ProcessedEvent[] {
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

            const retObj: ProcessedEvent = {
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
        .filter((event): event is ProcessedEvent => event !== null);

    return logRes;
  }

  private async fetchAndProcessEvents(
      fromBlock: number,
      toBlock: number,
  ): Promise<ProcessedEvent[]> {
    const processedEvents: ProcessedEvent[] = [];
    console.log('0 - fetchAndProcessEvents: Fetching events from', fromBlock, 'to', toBlock);
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

        console.log('1 - fetchAndProcessEvents');
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
      console.log('2 - fetchAndProcessEvents');
    }
    console.log('3 - fetchAndProcessEvents');


    return processedEvents;
  }

  private async queueEvents(events: ProcessedEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.info(
          `Appending message to queue ${this.configService.getEventQueueURL()
          }\n msg ${JSON.stringify(event)}`,
      );
      await this.sqsService.sendMessage(
          this.configService.getEventQueueURL(),
          JSON.stringify(event),
      );
    }
  }

  async getStartBlockNumber(): Promise<number> {
    const MaxNumberOfBlocksToProess = this.configService.getMaxNumberOfBlocksToProcess();
    console.log('0 - getStartBlockNumber, MaxNumberOfBlocksToProess: ', MaxNumberOfBlocksToProess);
    const currentBlockNumber = await this.getEndBlockNumber();
    console.log('1 - getStartBlockNumber, currentBlockNumber: ', currentBlockNumber);
    const defaultBlockNumber = Math.max(currentBlockNumber - MaxNumberOfBlocksToProess, 0);
    console.log('2 - getStartBlockNumber, defaultBlockNumber: ', defaultBlockNumber);
    const lastBlockScanned = this.configService.getLastBlockScanned();
    console.log('3 - getStartBlockNumber, lastBlockScanned: ', lastBlockScanned);

    if (lastBlockScanned == 0 ||
      currentBlockNumber - lastBlockScanned > MaxNumberOfBlocksToProess ||
      lastBlockScanned > currentBlockNumber) {
      return defaultBlockNumber;
    }

    return lastBlockScanned;
  }
}
