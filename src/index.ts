import {ethers} from 'ethers';

import {PrismaClient} from '@prisma/client';
import {ConfigServiceAWS} from './services/config/ConfigServiceAWS';
import {EventProcessorService} from './EventProcessorService';
import {LoggerAll} from './services/logger/LoggerAll';

// Handle SIGINT signal
let sigint = false;
process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  sigint = true;
});

// Run the main function on each mined block
(async (): Promise<void> => {
  let isRunning = false;

  const environment = process.env.ENVIRONMENT as string;
  const region = process.env.AWS_REGION as string;
  const configService: ConfigServiceAWS = new ConfigServiceAWS(environment, region);
  await configService.refreshConfig();
  const prisma = new PrismaClient();
  const mainRpcProvider = new ethers.providers.JsonRpcProvider(configService.getMainRPCURL());
  const altRpcProvider = new ethers.providers.JsonRpcProvider(configService.getAlternativeRPCURL());
  const logger = new LoggerAll(configService);

  mainRpcProvider.on('block', async (blockNumber: number) => {
    logger.info(`New block mined: ${blockNumber}`);

    // Prevent performActions from being called if it's already running
    if (isRunning) {
      console.warn('Already performing actions on another block. Skipping this block.');
      logger.warning('Already performing actions on another block. Skipping this block.');
      return;
    }

    isRunning = true;

    try {
      const eventProcessorService = new EventProcessorService(
          logger,
          configService,
          prisma,
          mainRpcProvider,
          altRpcProvider,
      );
      await eventProcessorService.execute();

      if (sigint) {
        await logger.flush();
        process.exit(0);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error running events fetcher:', error);
      logger.error('Error running events fetcher:');
      logger.error(error);
    } finally {
      await logger.flush();
      // Mark as not running
      isRunning = false;
    }
  });
})();
