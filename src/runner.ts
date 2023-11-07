// require('newrelic');
import { EventProcessorService } from './EventProcessorService';
import { Logger } from './logger/logger';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
import { ethers } from 'ethers';

export const handler = async (event: any, context: any): Promise<void> => {
  const alchemyProvider = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_API_URL ?? '',
  );
  const infuraProvider = new ethers.JsonRpcProvider(
    process.env.INFURA_API_URL ?? '',
  );
  const s3Service = new S3Service();
  const sqsService = new SQSService();
  const logger = new Logger();

  const eventProcessorService = new EventProcessorService(
    alchemyProvider,
    infuraProvider,
    s3Service,
    sqsService,
    logger,
  );

  await eventProcessorService.execute();
};

handler({}, {}).then(r => console.log(r));
