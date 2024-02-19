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
  protected pspContractInfo: ContractInfoPSP[] = [];
  protected lastBlockScanned: number = 0;

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

  public getLastBlockScanned(): number {
    return this.lastBlockScanned;
  }
}

/* abstract getRPCURL(): string;
  abstract getAlternateRPCURL(): string;

  abstract getLastBlockScanned(): number;

  abstract getEventsFetchPageSize(): number;
  abstract getNewEventsQueueURL(): string;*/
