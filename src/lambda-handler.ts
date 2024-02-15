import {S3Service, SQSService, Logger} from '@thisisarchimedes/backend-sdk';
import {EventProcessorService} from './EventProcessorService';
import {ConfigServiceLeverage} from './services/config/ConfigServiceLeverage';
import {ethers} from 'ethers';
import {EnvironmentContext} from './types/EnvironmentContext';
import {ConfigServicePSP} from './services/config/ConfigServicePSP';

const s3Service = new S3Service();
const sqsService = new SQSService();

export const handler = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _event: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _context: any,
): Promise<void> => {
  console.log('>> 0 - handler');

  Logger.initialize('Events fetcher');

  console.log('>> 1 - handler');
  const configService = new ConfigServiceLeverage();
  console.log('>> 2 - handler');

  const _appContext: EnvironmentContext = await configService.getEnvironmentContext();
  console.log('>> 2.5 - handler ', _appContext);

  const logger = Logger.getInstance();
  console.log('>> 3 - handler');

  const mainrovider = new ethers.providers.JsonRpcProvider(
      _appContext.rpcAddress ?? '',
  );
  const altProvider = new ethers.providers.JsonRpcProvider(
      _appContext.alternateRpcAddress ?? '',
  );
  console.log('>> 4 - handler');

  const pspBucketName = process.env.PSP_STRATEGY_CONFIG_BUCKET as string;
  const pspFileName = process.env.PSP_STRATEGY_CONFIG_FILE as string;
  console.log('>> 5 - handler', pspBucketName, ' - ', pspFileName);
  const configServicePSP: ConfigServicePSP = new ConfigServicePSP(pspBucketName, pspFileName);
  console.log('>> 6 - handler');


  await configServicePSP.refreshStrategyConfig();

  const eventProcessorService = new EventProcessorService(
      mainrovider,
      altProvider,
      s3Service,
      sqsService,
      logger,
      _appContext,
      configServicePSP,
  );

  await eventProcessorService.execute();
};
