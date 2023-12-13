import { S3Service } from './s3Service';
import { EnviromentContext } from '../types/EnviromentContext';

export class ConfigService {
  private readonly s3: S3Service;

  constructor() {
    this.s3 = new S3Service();
  }

  async getEnviromentContext(): Promise<EnviromentContext> {
    //get leverage engine address from config bucket
    let obj = await this.s3.getObject(
      process.env.S3_BUCKET_CONFIG ?? '',
      process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
    );

    let contracts = JSON.parse(obj);
    let positionOpener = contracts.filter(
      (f: any) => f.name == 'PositionOpener',
    )[0].address;

    let positionCloser = contracts.filter(
      (f: any) => f.name == 'PositionCloser',
    )[0].address;

    let enviroment = process.env.ENVIRONMENT ?? 'local';

    let _context: EnviromentContext = {
      positionCloserAddress: positionOpener,
      positionOpenerAddress: positionCloser,
      enviroment: enviroment,
      S3_BUCKET: process.env.S3_BUCKET || '',
      S3_LAST_BLOCK_KEY: process.env.S3_LAST_BLOCK_KEY ?? '',
      SQS_QUEUE_URL: process.env.SQS_QUEUE_URL ?? '',
      EVENTS_FETCH_PAGE_SIZE: Number(
        process.env.EVENTS_FETCH_PAGE_SIZE ?? '1000',
      ),
      NEW_EVENTS_QUEUE_URL: process.env.NEW_EVENTS_QUEUE_URL ?? '',
    };

    return _context;
  }
}
