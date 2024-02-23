import {Logger} from '@thisisarchimedes/backend-sdk';
import {EventProcessorService} from './EventProcessorService';
import {ConfigServiceAWS} from './services/config/ConfigServiceAWS';

export const handler = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _event: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _context: any,
): Promise<void> => {
  Logger.initialize('Events fetcher');
  const logger = Logger.getInstance();

  try {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;
    const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
    await configService.refreshConfig();

    const eventProcessorService = new EventProcessorService(logger, configService);

    await eventProcessorService.execute();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (ex: any) {
    console.log('Error:', (ex as Error).message);
  } finally {
    await logger.flush();
  }
};
