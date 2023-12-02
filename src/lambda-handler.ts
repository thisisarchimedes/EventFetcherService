import { EventProcessorService } from './EventProcessorService';
import { Logger } from './logger/logger';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
import { ethers } from 'ethers';
import { ConfigService } from './services/configService';

// Moved outside the handler function
const alchemyProvider = new ethers.providers.JsonRpcProvider(
  process.env.ALCHEMY_API_URL ?? '',
);
const infuraProvider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_API_URL ?? '',
);
const s3Service = new S3Service();
const sqsService = new SQSService();
const logger = new Logger();
let leverageEngineAddress: string;

const initializeDependencies = async () => {
  if (!leverageEngineAddress) {
    leverageEngineAddress = await new ConfigService().getLeverageEngineAddress();
  }
};

export const handler = async (event: any, context: any): Promise<void> => {
  if (leverageEngineAddress === undefined) await initializeDependencies();

  logger.info('Working with leverageEngine at: ', leverageEngineAddress);

  const eventProcessorService = new EventProcessorService(
    alchemyProvider,
    infuraProvider,
    s3Service,
    sqsService,
    logger,
    leverageEngineAddress,
  );

  await eventProcessorService.execute();
};
