import { ethers } from 'ethers';
import rawEventDescriptors from './events.json';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
import dotenv from 'dotenv';
import { IEventProcessorService } from './IEventProcessorService';
import { Logger } from './logger/logger';
import { ContractType, EventDescriptor } from './types/EventDescriptor';
import { EnviromentContext } from './types/EnviromentContext';

dotenv.config();

const EVENT_DESCRIPTORS: EventDescriptor[] = rawEventDescriptors.map(event => {
  let contractType =
    event.name === 'PositionOpened'
      ? 0
      : event.name == 'PositionCloser'
      ? 1
      : 1; //for other future types like liquidation
  let obj = {
    ...event,
    signature: ethers.utils.id(
      `${event.name}(${event.decodeData.map(param => param.type).join(',')})`,
    ),
    contractType: contractType,
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
  private readonly _context: EnviromentContext;

  constructor(
    mainProvider: ethers.providers.Provider,
    altProvider: ethers.providers.Provider,
    s3Service: S3Service,
    sqsService: SQSService,
    logger: Logger,
    context: EnviromentContext,
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
          this.logger.error(`Failed to decode log: ${JSON.stringify(error)}`);
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
      startBlock += this._context.EVENTS_FETCH_PAGE_SIZE
    ) {
      const endBlock = Math.min(
        startBlock + this._context.EVENTS_FETCH_PAGE_SIZE - 1,
        toBlock,
      );
      for (const descriptor of this.EVENT_DESCRIPTORS) {
        let filter = {};

        const contractAddress =
          descriptor.contractType == ContractType.Opener
            ? this._context.positionOpenerAddress
            : this._context.positionCloserAddress;

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

  private async queueEvents(events: any[]): Promise<void> {
    for (const event of events) {
      await this.sqsService.sendMessage(
        this._context.NEW_EVENTS_QUEUE_URL,
        JSON.stringify(event),
      );
    }
  }

  async getLastScannedBlock(): Promise<number> {
    let _default = (await this.getCurrentBlockNumber()) - 1000;
    if (_default < 0) _default = 0;
    try {
      const data = await this.s3Service.getObject(
        this._context.S3_BUCKET,
        this._context.S3_LAST_BLOCK_KEY,
      );
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
      this._context.S3_BUCKET,
      this._context.S3_LAST_BLOCK_KEY,
      blockNumber.toString(),
    );
  }
}
