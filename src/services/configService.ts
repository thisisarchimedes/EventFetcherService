import { S3Service } from '@thisisarchimedes/backend-sdk';
import { ContractAddress } from '../types/ContractAddress';
import { EnvironmentContext } from '../types/EnvironmentContext';

export class ConfigService {
  private readonly s3: S3Service;

  constructor() {
    this.s3 = new S3Service();
  }

  private async fetchS3Object(bucket: string, key: string): Promise<string> {
    return await this.s3.getObject(bucket, key);
  }

  private fetchContractAddress(
    name: string,
    contractsJson: string,
  ): string {
    const contracts = JSON.parse(contractsJson) as ContractAddress[];
    const contract = contracts.find((contract) => contract.name === name);
    return contract?.address || '';
  }

  async fetchLastScannedBlock(): Promise<number> {
    const lastBlockKey = process.env.S3_LAST_BLOCK_KEY ?? '';
    const lastBlockBucket = process.env.S3_BUCKET;

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

  private async fetchRpcAddress(
    configBucket: string,
    rpcKey: string,
  ): Promise<string> {
    const rpcJson = await this.fetchS3Object(configBucket, rpcKey);
    return JSON.parse(rpcJson)['rpc'];
  }

  private async fetchPositionAddresses(
    contractAddressesJson: string,
  ): Promise<Record<string, string>> {
    const names = [
      'PositionOpener',
      'PositionCloser',
      'PositionLiquidator',
      'positionExpirator',
      'ExpiredVault'
    ];
    const addresses = await Promise.all(
      names.map((name) => this.fetchContractAddress(name, contractAddressesJson)),
    );
    return Object.fromEntries(
      names.map((name, index) => [`${name}Address`, addresses[index]]),
    );
  }

  private getEnvironmentConfig(): {
    environment: string;
    configBucket: string;
    rpcKey: string;
    contractAddressesKey: string;
    newEventsQueueURL: string;
  } {
    return {
      environment: process.env.ENVIRONMENT ?? 'local',
      configBucket: process.env.S3_BUCKET_CONFIG ?? '',
      rpcKey: process.env.S3_FORK_KEY ?? '',
      contractAddressesKey: process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
      newEventsQueueURL: process.env.NEW_EVENTS_QUEUE_URL ?? '',
    };
  }

  async getEnvironmentContext(): Promise<EnvironmentContext> {
    const {
      environment,
      configBucket,
      rpcKey,
      contractAddressesKey,
      newEventsQueueURL,
    } = this.getEnvironmentConfig();

    const [
      rpcAddress,
      contractAddressesJson,
      lastBlockScanned,
    ] = await Promise.all([
      this.fetchRpcAddress(configBucket, rpcKey),
      this.fetchS3Object(configBucket, contractAddressesKey),
      this.fetchLastScannedBlock(),
    ]);

    const positionAddresses = await this.fetchPositionAddresses(
      contractAddressesJson,
    );

    return {
      positionCloserAddress: positionAddresses['PositionCloserAddress'],
      positionExpiratorAddress: positionAddresses['positionExpiratorAddress'],
      positionLiquidatorAddress: positionAddresses['PositionLiquidatorAddress'],
      positionOpenerAddress: positionAddresses['PositionOpenerAddress'],
      expiredVaultAddress: positionAddresses['ExpiredVaultAddress'],
      environment,
      S3_BUCKET: process.env.S3_BUCKET ?? '',
      lastBlockScanned,
      S3_LAST_BLOCK_KEY: process.env.S3_LAST_BLOCK_KEY ?? '',
      EVENTS_FETCH_PAGE_SIZE: Number(
        process.env.EVENTS_FETCH_PAGE_SIZE ?? '1000',
      ),
      NEW_EVENTS_QUEUE_URL: newEventsQueueURL,
      rpcAddress,
      alternateRpcAddress: rpcAddress,
    };
  }
}
