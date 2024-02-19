import { ethers } from 'ethers';
import rawEventDescriptors from './events.json';
import { S3Service, SQSService, Logger } from '@thisisarchimedes/backend-sdk';
import dotenv from 'dotenv';
import { IEventProcessorService } from './IEventProcessorService';
import {
  ContractType,
  DecodedData,
  EventDescriptor,
} from './types/EventDescriptor';
import { EnvironmentContext } from './types/EnvironmentContext';
import { ProcessedEvent } from './types/ProcessedEvent';
import { EventData } from './types/EventData';

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
  private readonly mainProvider: ethers.providers.Provider;
  private readonly altProvider: ethers.providers.Provider;
  private readonly s3Service: S3Service;
  private readonly sqsService: SQSService;
  private readonly EVENT_DESCRIPTORS = EVENT_DESCRIPTORS;
  private readonly logger: Logger;
  private readonly _context: EnvironmentContext;

  constructor(
    mainProvider: ethers.providers.Provider,
    altProvider: ethers.providers.Provider,
    s3Service: S3Service,
    sqsService: SQSService,
    logger: Logger,
    context: EnvironmentContext,
  ) {
    this.mainProvider = mainProvider;
    this.altProvider = altProvider;
    this.s3Service = s3Service;
    this.sqsService = sqsService;
    this.logger = logger;
    this._context = context;
  }

  public async execute(): Promise<void> {
    try {
      this.logger.info('Executing the event fetcher workflow...');
      this.logger.info(`RPC: ${this._context.rpcAddress}\n
                        SQS queue: ${this._context.NEW_EVENTS_QUEUE_URL}\n
                        Env: ${this._context.environment}`);

      const lastBlock = await this.getLastScannedBlock();
      this.logger.info('4');

      const currentBlock = await this.getCurrentBlockNumber();
      this.logger.info('5');

      const events: ProcessedEvent[] = await this.fetchAndProcessEvents(lastBlock, currentBlock);
      this.logger.info('6');

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
      this.logger.info('4');

      await this.setLastScannedBlock(currentBlock);
      this.logger.info('Event fetcher workflow completed.');
    } catch (error) {
      this.logger.error(`Error in event fetcher workflow: ${error}`);
    }
  }

  private async getCurrentBlockNumber(): Promise<number> {
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

  private getContractAddressByType(contractType: ContractType): string {
    switch (contractType) {
      case ContractType.Opener:
        return this._context.positionOpenerAddress;
      case ContractType.Closer:
        return this._context.positionCloserAddress;
      case ContractType.Liquidator:
        return this._context.positionLiquidatorAddress;
      case ContractType.Expirator:
        return this._context.positionExpiratorAddress;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
  }


  private async fetchAndProcessEvents(fromBlock: number, toBlock: number): Promise<ProcessedEvent[]> {
    const processedEvents: ProcessedEvent[] = [];

    for (let startBlock = fromBlock + 1; startBlock <= toBlock; startBlock += this._context.EVENTS_FETCH_PAGE_SIZE) {
      const endBlock = Math.min(startBlock + this._context.EVENTS_FETCH_PAGE_SIZE - 1, toBlock);

      // Create a combined filter for all events
      let filters = this.EVENT_DESCRIPTORS.map(descriptor => {
        return {
          address: this.getContractAddressByType(descriptor.contractType),
          topics: [descriptor.signature],
          fromBlock: startBlock,
          toBlock: endBlock
        };
      });

      // Fetch logs once for each block range
      const fetchedLogs = await this.fetchLogsFromCombinedFilters(filters);

      // Process fetched logs for each event descriptor
      for (const descriptor of this.EVENT_DESCRIPTORS) {
        const relevantLogs = fetchedLogs.filter(log => log.topics.includes(descriptor.signature));
        const processedLogs = this.decodeAndProcessLogs(relevantLogs, descriptor);
        processedEvents.push(...processedLogs);
      }
    }

    return processedEvents;
  }

  private async fetchLogsFromCombinedFilters(filters: ethers.providers.Filter[]): Promise<ethers.providers.Log[]> {
    const allLogs = [];
    for (const filter of filters) {
      const logs = await this.fetchLogsFromProviders(filter);
      allLogs.push(...logs);
    }
    return this.deduplicateLogs(allLogs);
  }

  private async queueEvents(events: ProcessedEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.info(
        `Appending message to queue ${this._context.NEW_EVENTS_QUEUE_URL
        }\n msg ${JSON.stringify(event)}`,
      );
      await this.sqsService.sendMessage(
        this._context.NEW_EVENTS_QUEUE_URL,
        JSON.stringify(event),
      );
    }
  }

  async getLastScannedBlock(): Promise<number> {
    const currentBlockNumber = await this.getCurrentBlockNumber();
    const defaultBlockNumber = Math.max(currentBlockNumber - 1000, 0);
    return this._context.lastBlockScanned > 0 ?
      this._context.lastBlockScanned :
      defaultBlockNumber;
  }

  async setLastScannedBlock(blockNumber: number): Promise<void> {
    const bucket = this._context.S3_BUCKET;

    await this.s3Service.putObject(
      bucket,
      this._context.S3_LAST_BLOCK_KEY,
      blockNumber.toString(),
    );
  }
}
