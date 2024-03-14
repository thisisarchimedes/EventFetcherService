import {ContractInfoPSP} from '../../types/ContractInfoPSP';

export interface LeverageContractAddresses {
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  positionExpiratorAddress: string;
}

export abstract class ConfigService {
  protected environment: string = '';
  protected leverageContractAddresses!: LeverageContractAddresses;
  protected pspContractInfo: ContractInfoPSP[] = [];
  protected lastBlockScanned: number = 0;
  protected MainRPCURL: string = '';
  protected AltRPCURL: string = '';
  protected EventFetchPageSize: number = 0;
  protected MaxNumberOfBlocksToProess: number = 1000;

  abstract refreshConfig(): Promise<void>;
  abstract setLastScannedBlock(blockNumber: number): Promise<void>;

  public getEnvironment(): string {
    return this.environment;
  }

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

  public getPSPContractAddressByStrategyName(strategyName: string): string {
    const contract = this.pspContractInfo.find((contract: { strategyName: string; }) =>
      contract.strategyName === strategyName,
    );

    return contract?.strategyAddress || '';
  }

  public getPSPStrategyInfoByAddress(strategyAddress: string): ContractInfoPSP | undefined {
    return this.pspContractInfo.find((contract: { strategyAddress: string; }) =>
      contract.strategyAddress === strategyAddress,
    );
  }

  public getPSPStrategyCount(): number {
    return this.pspContractInfo.length;
  }

  public getLastBlockScanned(): number {
    return this.lastBlockScanned;
  }

  public getMainRPCURL(): string {
    return this.MainRPCURL;
  }

  public getAlternativeRPCURL(): string {
    return this.AltRPCURL;
  }

  public getEventsFetchPageSize(): number {
    return this.EventFetchPageSize;
  }

  public getMaxNumberOfBlocksToProcess(): number {
    return this.MaxNumberOfBlocksToProess;
  }
}
