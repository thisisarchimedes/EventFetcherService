import { ethers } from 'ethers';
import rawEventDescriptors from './events.json';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
import dotenv from 'dotenv';
import { IEventProcessorService } from './IEventProcessorService';
import { Logger } from './logger/logger';
import { EventDescriptor } from './types/EventDescriptor';

dotenv.config();

const EVENT_DESCRIPTORS: EventDescriptor[] = rawEventDescriptors.map(event => ({
  ...event,
  signature: ethers.utils.id(
    `${event.name}(${event.decodeData.map(param => param.type).join(',')})`,
  ),
}));

export class EventProcessorService implements IEventProcessorService {
  private readonly alchemyProvider: ethers.providers.Provider;
  private readonly infuraProvider: ethers.providers.Provider;
  private readonly s3Service: S3Service;
  private readonly sqsService: SQSService;
  private readonly LEVERAGE_ENGINE_ADDRESS: string;
  private readonly EVENT_DESCRIPTORS = EVENT_DESCRIPTORS;
  private readonly S3_BUCKET: string;
  private readonly S3_KEY: string;
  private readonly SQS_QUEUE_URL: string;
  private readonly EVENTS_FETCH_PAGE_SIZE: number;
  private readonly logger: Logger;

  constructor(
    alchemyProvider: ethers.providers.Provider,
    infuraProvider: ethers.providers.Provider,
    s3Service: S3Service,
    sqsService: SQSService,
    logger: Logger,
    config: { [key: string]: any } = process.env,
  ) {
    this.alchemyProvider = alchemyProvider;
    this.infuraProvider = infuraProvider;
    this.s3Service = s3Service;
    this.sqsService = sqsService;
    this.logger = logger;

    // Ensure these environment variables are set in your .env file
    this.S3_BUCKET = config.S3_BUCKET ?? '';
    this.S3_KEY = config.S3_KEY ?? '';
    this.SQS_QUEUE_URL = config.SQS_QUEUE_URL ?? '';
    this.LEVERAGE_ENGINE_ADDRESS = config.LEVERAGE_ENGINE_ADDRESS ?? '';
    this.EVENTS_FETCH_PAGE_SIZE = Number(config.EVENTS_FETCH_PAGE_SIZE) || 1000;
  }

  public async execute(): Promise<void> {
    try {
      this.logger.info('Executing the event fetcher workflow...');

      const lastBlock = await this.getLastScannedBlock();
      const currentBlock = await this.getCurrentBlockNumber();
      const events = await this.fetchAndProcessEvents(lastBlock, currentBlock);

      if (events.length > 0) {
        this.logger.info(
          `fetched ${events.length} events from blocks ${lastBlock} to ${currentBlock}`,
        );
        await this.queueEvents(events);
      } else {
        this.logger.info(
          `no new events found on blocks ${lastBlock} to ${currentBlock}`,
        );
      }

      await this.setLastScannedBlock(currentBlock);

      this.logger.info('Event fetcher workflow completed.');
    } catch (error) {
      console.log(error);
    }
  }

  private async getCurrentBlockNumber(): Promise<number> {
    const [alchemyBlock, infuraBlock] = await Promise.all([
      this.alchemyProvider.getBlockNumber(),
      this.infuraProvider.getBlockNumber(),
    ]);
    return Math.min(alchemyBlock, infuraBlock);
  }

  private async fetchLogsFromProviders(
    filter: ethers.providers.Filter,
  ): Promise<ethers.providers.Log[]> {
    const [alchemyLogs, infuraLogs] = await Promise.all([
      this.alchemyProvider.getLogs(filter),
      this.infuraProvider.getLogs(filter),
    ]);
    return [...alchemyLogs, ...infuraLogs];
  }

  private deduplicateLogs(
    logs: ethers.providers.Log[],
  ): ethers.providers.Log[] {
    return Array.from(
      logs
        .map(log => ({ hash: log.transactionHash + log.logIndex, log }))
        .reduce(
          (acc, { hash, log }) => acc.set(hash, log),
          new Map<string, ethers.providers.Log>(),
        )
        .values(),
    );
  }
  private decodeAndProcessLogs(
    logs: ethers.providers.Log[],
    descriptor: EventDescriptor,
  ): any[] {
    return logs
      .map(log => {
        const indexedTypes = descriptor.decodeData
          .filter((param: any) => param.indexed)
          .map((param: any) => param.type);

        const nonIndexedTypes = descriptor.decodeData
          .filter((param: any) => !param.indexed)
          .map((param: any) => param.type);

        try {
          // Decode non-indexed parameters from log.data
          const nonIndexedData = ethers.utils.defaultAbiCoder.decode(
            nonIndexedTypes,
            log.data,
          );

          // Decode indexed parameters from log.topics
          const indexedData = indexedTypes.map((type: any, index: any) => {
            const topic = log.topics[index + 1];
            return ethers.utils.defaultAbiCoder.decode([type], topic)[0];
          });

          // Merge both indexed and non-indexed data
          const allData = [...indexedData, ...nonIndexedData];

          let eventData: any = {};
          descriptor.decodeData.forEach((param: any, index: number) => {
            eventData[param.name] = allData[index].toString();
          });

          return {
            name: descriptor.name,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            data: eventData,
          };
        } catch (error) {
          if (error instanceof Error) {
            this.logger.error('Failed to decode log:', error);
          }
          return null;
        }
      })
      .filter(event => event !== null); // Filter out failed decodings
  }

  private async fetchAndProcessEvents(
    fromBlock: number,
    toBlock: number,
  ): Promise<any[]> {
    const processedEvents: any[] = [];

    for (
      let startBlock = fromBlock + 1;
      startBlock <= toBlock;
      startBlock += this.EVENTS_FETCH_PAGE_SIZE
    ) {
      const endBlock = Math.min(
        startBlock + this.EVENTS_FETCH_PAGE_SIZE - 1,
        toBlock,
      );
      for (const descriptor of this.EVENT_DESCRIPTORS) {
        const filter = {
          address: this.LEVERAGE_ENGINE_ADDRESS,
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

  private async queueEvents(events: any[]): Promise<void> {
    for (const event of events) {
      await this.sqsService.sendMessage(
        this.SQS_QUEUE_URL,
        JSON.stringify(event),
      );
    }
  }

  async getLastScannedBlock(): Promise<number> {
    let _default = (await this.getCurrentBlockNumber()) - 1000;
    if (_default < 0) _default = 0;
    try {
      const data = await this.s3Service.getObject(this.S3_BUCKET, this.S3_KEY);
      if (data === undefined) {
        return _default;
      }
      return parseInt(data);
    } catch (e) {
      return _default; // Default to 1000 blocks ago
    }
  }

  async setLastScannedBlock(blockNumber: number): Promise<void> {
    await this.s3Service.putObject(
      this.S3_BUCKET,
      this.S3_KEY,
      blockNumber.toString(),
    );
  }
}
