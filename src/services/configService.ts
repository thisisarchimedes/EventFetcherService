import { S3Service } from '@thisisarchimedes/backend-sdk';
import { EnvironmentContext } from '../types/EnvironmentContext';

export class ConfigService {
  private readonly s3: S3Service;

  constructor() {
    this.s3 = new S3Service();
  }

  private async fetchS3Object(bucket: string, key: string): Promise<string> {
    return await this.s3.getObject(bucket, key);
  }

  private async fetchContractAddress(
    name: string,
    contractsJson: string,
  ): Promise<string> {
    const contracts = JSON.parse(contractsJson);
    const contract = contracts.find((f: any) => f.name === name);
    return contract?.address || '';
  }

  async fetchLastScannedBlock(isDemo: boolean): Promise<number> {
    const lastBlockKey = process.env.S3_LAST_BLOCK_KEY ?? '';

    const lastBlockBucket = isDemo
      ? process.env.S3_BUCKET_DEMO
      : process.env.S3_BUCKET;

    try {
      const lastBlockScanned = parseInt(
        await this.fetchS3Object(lastBlockBucket ?? '', lastBlockKey),
        10,
      );
      return lastBlockScanned;
    } catch {
      return 0;
    }
  }

  async getEnvironmentContext(): Promise<EnvironmentContext> {
    const environment = process.env.ENVIRONMENT ?? 'local';
    const isDemo = environment.toLowerCase() === 'demo';

    const configBucket = process.env.S3_BUCKET_CONFIG ?? '';
    const rpcKey = isDemo
      ? process.env.S3_DEMO_FORK_KEY
      : process.env.S3_TEST_FORK_KEY;

    const contractAddressesKey = isDemo
      ? process.env.S3_DEPLOYMENT_ADDRESS_KEY_DEMO
      : process.env.S3_DEPLOYMENT_ADDRESS_KEY;

    const rpcJson = await this.fetchS3Object(configBucket, rpcKey ?? '');

    const contractAddressesJson = await this.fetchS3Object(
      configBucket,
      contractAddressesKey ?? '',
    );

    const rpcAddress = JSON.parse(rpcJson)['rpc'];
    const positionOpener = await this.fetchContractAddress(
      'PositionOpener',
      contractAddressesJson,
    );
    const positionCloser = await this.fetchContractAddress(
      'PositionCloser',
      contractAddressesJson,
    );
    const positionLiquidator = await this.fetchContractAddress(
      'PositionLiquidator',
      contractAddressesJson,
    );

    const lastBlockScanned = await this.fetchLastScannedBlock(isDemo);

    return {
      positionCloserAddress: positionCloser,
      positionOpenerAddress: positionOpener,
      positionLiquidatorAddress: positionLiquidator,
      environment: environment,
      S3_BUCKET: process.env.S3_BUCKET ?? '',
      S3_BUCKET_DEMO: process.env.S3_BUCKET_DEMO ?? '',
      lastBlockScanned: lastBlockScanned,
      S3_LAST_BLOCK_KEY: process.env.S3_LAST_BLOCK_KEY ?? '',
      EVENTS_FETCH_PAGE_SIZE: Number(
        process.env.EVENTS_FETCH_PAGE_SIZE ?? '1000',
      ),
      NEW_EVENTS_QUEUE_URL: process.env.NEW_EVENTS_QUEUE_URL ?? '',
      rpcAddress: rpcAddress,
      alternateRpcAddress: rpcAddress,
    };
  }
}
