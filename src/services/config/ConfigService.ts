import {S3Service} from '@thisisarchimedes/backend-sdk';
import {ContractAddress} from '../../types/ContractAddress';

export interface LeverageContractAddresses {
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  positionExpiratorAddress: string;
}

export abstract class ConfigService {
  protected environment: string;

  protected leverageContractAddresses: LeverageContractAddresses;
  protected readonly s3Service: S3Service = new S3Service();

  constructor(environment: string) {
    this.environment = environment;
    this.leverageContractAddresses = {
      positionOpenerAddress: '',
      positionLiquidatorAddress: '',
      positionCloserAddress: '',
      positionExpiratorAddress: '',
    } as LeverageContractAddresses;
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

  /* abstract getRPCURL(): string;
  abstract getAlternateRPCURL(): string;

  abstract getLastBlockScanned(): number;

  abstract getEventsFetchPageSize(): number;
  abstract getNewEventsQueueURL(): string;*/

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

  private async getLeverageContractAddressesFromS3(): Promise<ContractAddress[]> {
    const bucket = process.env.S3_BUCKET_CONFIG || '';
    const key = process.env.S3_DEPLOYMENT_ADDRESS_KEY || '';

    return JSON.parse(await this.fetchS3Object(bucket, key));
  }

  private async fetchS3Object(bucket: string, key: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, key);
    return response.toString();
  }
}
