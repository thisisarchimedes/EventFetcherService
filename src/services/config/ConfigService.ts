import { S3Service } from "@thisisarchimedes/backend-sdk";

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

  /*abstract getRPCURL(): string;
  abstract getAlternateRPCURL(): string;

  abstract getLastBlockScanned(): number;

  abstract getEventsFetchPageSize(): number;
  abstract getNewEventsQueueURL(): string;*/

  protected async fetchS3Object(bucket: string, key: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, key);
    return response.toString();
  }
}
