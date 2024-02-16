import {S3Service} from '@thisisarchimedes/backend-sdk';
import {ContractInfoLeverage} from '../../types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../types/ContractInfoPSP';

export interface LeverageContractAddresses {
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  positionExpiratorAddress: string;
}

export abstract class ConfigService {
  protected leverageContractAddresses!: LeverageContractAddresses;
  protected pspContractInfo!: ContractInfoPSP[];

  protected readonly s3Service: S3Service = new S3Service();
  protected s3ConfigBucket: string;
  protected s3LeverageInfoKey: string;
  protected s3PSPInfoKey: string;

  constructor(s3ConfigBucket: string, s3LeverageInfoKey: string, s3PSPInfoKey: string) {
    this.s3ConfigBucket = s3ConfigBucket;
    this.s3LeverageInfoKey = s3LeverageInfoKey;
    this.s3PSPInfoKey = s3PSPInfoKey;
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

  public getPSPContractAddress(strategyName: string): string {
    const contract = this.pspContractInfo.find((contract: { strategyName: string; }) =>
      contract.strategyName === strategyName,
    );

    return contract?.strategyAddress || '';
  }

  protected async refreshLeverageContractAddresses(): Promise<void> {
    const res = await this.getLeverageContractInfoFromS3();

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

  protected async refreshPSPContractInfo(): Promise<void> {
    this.pspContractInfo = JSON.parse(await this.fetchS3Object(this.s3ConfigBucket, this.s3PSPInfoKey));
  }

  private async getLeverageContractInfoFromS3(): Promise<ContractInfoLeverage[]> {
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
