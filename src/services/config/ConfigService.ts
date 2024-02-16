import {S3Service} from '@thisisarchimedes/backend-sdk';
import {ContractInfoLeverage} from '../../types/ContractInfoLeverage';

export interface LeverageContractAddresses {
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  positionExpiratorAddress: string;
}

export abstract class ConfigService {
  protected leverageContractAddresses!: LeverageContractAddresses;

  protected readonly s3Service: S3Service = new S3Service();
  protected s3ConfigBucket: string;
  protected s3LeverageInfoKey: string;

  constructor(s3ConfigBucket: string, s3LeverageInfoKey: string) {
    this.s3ConfigBucket = s3ConfigBucket;
    this.s3LeverageInfoKey = s3LeverageInfoKey;
  }
  abstract refreshConfig(): Promise<void>;

  public getLeveragePositionOpenerAddress(): string {
    return this.leverageContractAddresses.positionOpenerAddress;
  }

  public getLeveragePositionLiquidatorAddress(): string {
    return this.leverageContractAddresses.positionLiquidatorAddress;
  }

  public getLeveragePositionCloserAddress(): string {
    return this.leverageContractAddresses.positionCloserAddress;
  }

  public getLeveragePositionExpiratorAddress(): string {
    return this.leverageContractAddresses.positionExpiratorAddress;
  }

  protected async refreshLeverageContractAddresses(): Promise<void> {
    const res = await this.getLeverageContractAddressesFromS3();

    const positionOpenerAddress = res.find((contract: { name: string; }) => contract.name === 'PositionOpener');
    const positionLiquidatorAddress = res.find((contract: { name: string; }) =>
      contract.name === 'PositionLiquidator');
    const positionCloserAddress = res.find((contract: { name: string; }) => contract.name === 'PositionCloser');

    this.leverageContractAddresses = {
      positionOpenerAddress: positionOpenerAddress?.address || '',
      positionLiquidatorAddress: positionLiquidatorAddress?.address || '',
      positionCloserAddress: positionCloserAddress?.address || '',
      positionExpiratorAddress: '',
    } as LeverageContractAddresses;
  }

  private async getLeverageContractAddressesFromS3(): Promise<ContractInfoLeverage[]> {
    return JSON.parse(await this.fetchS3Object(this.s3ConfigBucket, this.s3LeverageInfoKey));
  }

  private async fetchS3Object(bucket: string, key: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, key);
    return response.toString();
  }
}

/* abstract getRPCURL(): string;
  abstract getAlternateRPCURL(): string;

  abstract getLastBlockScanned(): number;

  abstract getEventsFetchPageSize(): number;
  abstract getNewEventsQueueURL(): string;*/
