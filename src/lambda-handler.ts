// require('newrelic');
import { S3Service, SQSService, Logger } from '@thisisarchimedes/backend-sdk';
import { EventProcessorService } from './EventProcessorService';
import { ConfigService } from './services/configService';
import { ethers } from 'ethers';
import { EnviromentContext } from './types/EnviromentContext';

const s3Service = new S3Service();
const sqsService = new SQSService();
let _context: EnviromentContext;

const getEnviromentContext = async () => {
  _context = await new ConfigService().getEnviromentContext();
  return _context;
};
export const handler = async (event: any, context: any): Promise<void> => {
  if (_context === undefined) _context = await getEnviromentContext();

  const logger = new Logger(
    process.env.NEW_RELIC_LICENSE_KEY,
    process.env.NEW_RELIC_API_URL,
    _context.enviroment,
  );

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
