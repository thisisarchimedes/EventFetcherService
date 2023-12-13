// require('newrelic');
import { EventProcessorService } from './EventProcessorService';
import { Logger } from './logger/logger';
import { S3Service } from './services/s3Service';
import { SQSService } from './services/sqsService';
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

  const logger = new Logger(_context.enviroment);

  const alchemyProvider = new ethers.providers.JsonRpcProvider(
    _context.rpcAddress ?? '',
  );
  const infuraProvider = new ethers.providers.JsonRpcProvider(
    _context.alternateRpcAddress ?? '',
  );

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
