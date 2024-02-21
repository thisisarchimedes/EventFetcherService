import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import {EventProcessorService} from './EventProcessorService';
import {ConfigService} from './services/configService';
import {ethers} from 'ethers';
import {EnvironmentContext} from './types/EnvironmentContext';

const s3Service = new S3Service();
const sqsService = new SQSService();

export const handler = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _event: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _context: any,
): Promise<void> => {
  Logger.initialize('Events fetcher');
  const logger = Logger.getInstance();

  try {
    const configService = new ConfigService();

    const _appContext: EnvironmentContext = await configService.getEnvironmentContext();

    const mainrovider = new ethers.providers.JsonRpcProvider(
        _appContext.rpcAddress ?? '',
    );
    const altProvider = new ethers.providers.JsonRpcProvider(
        _appContext.alternateRpcAddress ?? '',
    );
    const eventProcessorService = new EventProcessorService(
        mainrovider,
        altProvider,
        s3Service,
        sqsService,
        logger,
        _appContext,
    );

    await eventProcessorService.execute();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (ex: any) {
    console.log('Error:', (ex as Error).message);
  } finally {
    await logger.flush();
  }
};
