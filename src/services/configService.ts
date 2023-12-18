import { S3Service } from '@thisisarchimedes/backend-sdk';
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

    let rpcJson = '';

    //get RPC URL
    if (enviroment === 'demo') {
      rpcJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_DEMO_FORK_KEY ?? '',
      );
    } else {
      rpcJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_TEST_FORK_KEY ?? '',
      );
    }

    let rpcAddress = JSON.parse(rpcJson)['rpc'];

    let _context: EnviromentContext = {
      positionCloserAddress: positionOpener,
      positionOpenerAddress: positionCloser,
      enviroment: enviroment,
      S3_BUCKET: process.env.S3_BUCKET || '',
      S3_LAST_BLOCK_KEY: process.env.S3_LAST_BLOCK_KEY ?? '',
      EVENTS_FETCH_PAGE_SIZE: Number(
        process.env.EVENTS_FETCH_PAGE_SIZE ?? '1000',
      ),
      NEW_EVENTS_QUEUE_URL: process.env.NEW_EVENTS_QUEUE_URL ?? '',
      rpcAddress: rpcAddress,
      alternateRpcAddress: rpcAddress,
    };

    return _context;
  }
}
