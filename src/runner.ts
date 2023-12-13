// require('newrelic');
import { EventProcessorService } from './EventProcessorService';
import { Logger } from './logger/logger';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
import { ConfigService } from './services/configService';
import { ethers } from 'ethers';
import { EnviromentContext } from './types/EnviromentContext';

// Moved outside the handler function
const alchemyProvider = new ethers.providers.JsonRpcProvider(
  process.env.ALCHEMY_API_URL ?? '',
);
const infuraProvider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_API_URL ?? '',
);
const s3Service = new S3Service();
const sqsService = new SQSService();
const logger = new Logger(process.env.ENVIRONMENT);
let _context: EnviromentContext;

const getEnviromentContext = async () => {
  _context = await new ConfigService().getEnviromentContext();
  return _context;
};
export const handler = async (event: any, context: any): Promise<void> => {
  if (_context === undefined) _context = await getEnviromentContext();

  const eventProcessorService = new EventProcessorService(
    alchemyProvider,
    infuraProvider,
    s3Service,
    sqsService,
    logger,
    _context,
  );

  await eventProcessorService.execute();
};

handler({}, {}).then(r => console.log(r));
