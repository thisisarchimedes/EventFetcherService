import { S3Service } from '@thisisarchimedes/backend-sdk';
import { EnviromentContext } from '../types/EnviromentContext';

export class ConfigService {
  private readonly s3: S3Service;

  constructor() {
    this.s3 = new S3Service();
  }

  async getEnviromentContext(): Promise<EnviromentContext> {
    let rpcJson = '';
    let enviroment = process.env.ENVIRONMENT ?? 'local';
    let contractAddressesJson = '';

    //get RPC URL
    if (enviroment.toLowerCase() === 'demo') {
      rpcJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_DEMO_FORK_KEY ?? '',
      );

      //get leverage engine address from config bucket
      contractAddressesJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_DEPLOYMENT_ADDRESS_KEY_DEMO ?? '',
      );
    } else {
      rpcJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_TEST_FORK_KEY ?? '',
      );

      //get leverage engine address from config bucket
      contractAddressesJson = await this.s3.getObject(
        process.env.S3_BUCKET_CONFIG ?? '',
        process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
      );
    }

    let contracts = JSON.parse(contractAddressesJson);
    let positionOpener = contracts.filter(
      (f: any) => f.name == 'PositionOpener',
    )[0].address;

    let positionCloser = contracts.filter(
      (f: any) => f.name == 'PositionCloser',
    )[0].address;

    let positionLiquidator = contracts.filter(
      (f: any) => f.name == 'PositionLiquidator',
    )[0].address;

    console.log('*** addresses positionOpener', positionOpener);
    console.log('*** addresses positionCloser', positionCloser);
    console.log('*** addresses positionLiquidator', positionLiquidator);

    let rpcAddress = JSON.parse(rpcJson)['rpc'];

    let _context: EnviromentContext = {
      positionCloserAddress: positionCloser,
      positionOpenerAddress: positionOpener,
      positionLiquidatorAddress: positionLiquidator,
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
