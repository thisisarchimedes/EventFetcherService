
import {ethers} from 'ethers';
import {type EventDescriptor} from './EventDescriptor';
import rawEventDescriptors from './eventDescriptors.json';
import {S3Service} from './services/s3Service';
import {SQSService} from './services/sqsService';
import dotenv from 'dotenv';

const EVENT_DESCRIPTORS: EventDescriptor[] = rawEventDescriptors.map(
  event => ({
    ...event,
    signature: ethers.id(
      `${event.name}(${event.decodeData.map(param => param.type).join(',')})`
    ),
  }),
);

export class EventProcessorService {
	private readonly alchemyProvider: ethers.JsonRpcProvider;
	private readonly infuraProvider: ethers.JsonRpcProvider;
	private readonly s3Service: S3Service;
	private readonly sqsService: SQSService;
	private readonly CONTRACT_ADDRESS: string;
	private readonly EVENT_DESCRIPTORS = EVENT_DESCRIPTORS;
	private readonly S3_BUCKET: string;
	private readonly S3_KEY: string;
	private readonly SQS_QUEUE_URL: string;
	private readonly PAGE_SIZE: number;

	constructor() {
		dotenv.config();

		this.alchemyProvider = new ethers.JsonRpcProvider(
			process.env.ALCHEMY_API_URL ?? '',
		);
		this.infuraProvider = new ethers.JsonRpcProvider(
			process.env.INFURA_API_URL ?? '',
		);

		this.s3Service = new S3Service();
		this.sqsService = new SQSService();
		this.S3_BUCKET = process.env.S3_BUCKET ?? '';
		this.S3_KEY = process.env.S3_KEY ?? '';
		this.SQS_QUEUE_URL = process.env.NEW_EVENTS_QUEUE_URL ?? '';
		this.CONTRACT_ADDRESS = process.env.LEVERAGE_ENGINE_ADDRESS ?? '';
		this.PAGE_SIZE = Number(process.env.EVENTS_FETCH_PAGE_SIZE) ?? 1000;
	}

	public async execute(): Promise<void> {
		console.log('Executing the event processing workflow...');

		const lastBlock = await this.getLastScannedBlock();
		const currentBlock = await this.getCurrentBlockNumber();
		const events = await this.fetchAndProcessEvents(lastBlock, currentBlock);
		if(events.length > 0){
			console.log(`fetched ${events.length} events from blocks ${lastBlock} to ${currentBlock}`);
			await this.queueEvents(events);
		}
		else{
			console.log(`no new events found on blocks ${lastBlock} to ${currentBlock}`);
		}
		
		await this.setLastScannedBlock(currentBlock);

		console.log('Event processing workflow completed.');
	}

	private async getCurrentBlockNumber(): Promise<number> {
		const [alchemyBlock, infuraBlock] = await Promise.all([
			this.alchemyProvider.getBlockNumber(),
			this.infuraProvider.getBlockNumber(),
		]);
		return Math.min(alchemyBlock, infuraBlock);
	}

	private async fetchLogsFromProviders(
		filter: ethers.Filter,
	): Promise<ethers.Log[]> {
		const [alchemyLogs, infuraLogs] = await Promise.all([
			this.alchemyProvider.getLogs(filter),
			this.infuraProvider.getLogs(filter),
		]);
		return [...alchemyLogs, ...infuraLogs];
	}

	private deduplicateLogs(logs: ethers.Log[]): ethers.Log[] {
		return Array.from(
			logs
				.map(log => ({hash: log.transactionHash + log.index, log}))
				.reduce(
					(acc, {hash, log}) => acc.set(hash, log),
					new Map<string, ethers.Log>(),
				)
				.values(),
		);
	}

	private decodeAndProcessLogs(logs: ethers.Log[], descriptor: any): any[] {
		return logs.map(log => {
			const indexedTypes = descriptor.decodeData
			.filter((param: any) => param.indexed)
			.map((param: any) => param.type);

			const nonIndexedTypes = descriptor.decodeData
			.filter((param: any) => !param.indexed)
			.map((param: any) => param.type);

			try {
			// Decode non-indexed parameters from log.data
			const nonIndexedData = ethers.AbiCoder.defaultAbiCoder().decode(
				nonIndexedTypes,
				log.data
			);

			// Decode indexed parameters from log.topics
			const indexedData = indexedTypes.map((type:any, index:any	) => {
				const topic = log.topics[index + 1];
				return ethers.AbiCoder.defaultAbiCoder().decode([type], topic)[0];
			});

			// Merge both indexed and non-indexed data
			const allData = [...indexedData, ...nonIndexedData];

			let retObj = {
				name: descriptor.name,
				txHash:log.transactionHash,
				data: Object.fromEntries(
				descriptor.decodeData.map((param: any, index: number) => [
					param.name,
					allData[index].toString(),
				]),
				),
			};

			return retObj;
			} catch (error) {
				console.error("Failed to decode log:", log);
				console.error("Error:", error);
			return null;  // Or handle error as you see fit
			}
		}).filter(event => event !== null);  // Filter out failed decodings
	}

	private async fetchAndProcessEvents(
		lastBlock: number,
		newBlock: number,
	): Promise<any[]> {
		const processedEvents: any[] = [];

		for (
			let startBlock = lastBlock + 1;
			startBlock <= newBlock;
			startBlock += this.PAGE_SIZE
		) {
			const endBlock = Math.min(startBlock + this.PAGE_SIZE - 1, newBlock);

			for (const descriptor of this.EVENT_DESCRIPTORS) {
				const filter = {
					address: this.CONTRACT_ADDRESS,
					topics: [descriptor.signature],
					fromBlock: startBlock,
					toBlock: endBlock,
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
			await this.sqsService.sendMessage(this.SQS_QUEUE_URL, JSON.stringify(event));
		}
	}

	async getLastScannedBlock(): Promise<number> {
		try {
			const data = await this.s3Service.getObject(this.S3_BUCKET, this.S3_KEY);
			return parseInt(data);
		} catch (e) {
			return (await this.getCurrentBlockNumber()) - 1000; // Default to 1000 blocks ago
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

