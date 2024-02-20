import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import {EventProcessorService} from './EventProcessorService';
import {ConfigServiceAWS} from './services/config/ConfigServiceAWS';
import {ethers} from 'ethers';
import {EnvironmentContext} from './types/EnvironmentContext';

export const handler = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _event: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _context: any,
): Promise<void> => {
  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
  await configService.refreshConfig();

  Logger.initialize('Events fetcher');
  const logger = Logger.getInstance();

  const eventProcessorService = new EventProcessorService(logger, configService);

  await eventProcessorService.execute();
};
