import { S3Service, SQSService, Logger } from '@thisisarchimedes/backend-sdk';
import { EventProcessorService } from './EventProcessorService';
import { ConfigService } from './services/configService';
import { ethers } from 'ethers';
import { EnvironmentContext } from './types/EnvironmentContext';

const s3Service = new S3Service();
const sqsService = new SQSService();

export const handler = async (event: any, context: any): Promise<void> => {
  Logger.initialize('Events fetcher');

  const configService = new ConfigService();

  const _context: EnvironmentContext = await configService.getEnvironmentContext();
  const logger = Logger.getInstance();

  const mainrovider = new ethers.providers.JsonRpcProvider(
    _context.rpcAddress ?? '',
  );
  const altProvider = new ethers.providers.JsonRpcProvider(
    _context.alternateRpcAddress ?? '',
  );

  const eventProcessorService = new EventProcessorService(
    mainrovider,
    altProvider,
    s3Service,
    sqsService,
    logger,
    _context,
  );

  await eventProcessorService.execute();
};

handler(null, null).then(a => {
  console.log(a);
});
