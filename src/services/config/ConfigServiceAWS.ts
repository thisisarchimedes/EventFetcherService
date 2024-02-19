import AWS from 'aws-sdk';

import {ContractInfoLeverage} from '../../types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../types/ContractInfoPSP';
import {ConfigService, LeverageContractAddresses} from './ConfigService';
import {AppConfigClient} from './AppConfigClient';


export class ConfigServiceAWS extends ConfigService {
  private readonly appConfigClient: AppConfigClient;

  constructor(environment: string, region: string) {
    super();
    this.appConfigClient = new AppConfigClient(environment, region);
  }

  public async refreshConfig(): Promise<void> {
    await Promise.all([
      this.refreshLeverageContractAddresses(),
      this.refreshPSPContractInfo(),
      this.refreshLastScannedBlock(),
    ]);
  }

  public async refreshLeverageContractAddresses(): Promise<void> {
    try {
      const leverageContractInfo = await this.fetchLeverageContractInfo();
      this.leverageContractAddresses = this.extractLeverageContractAddresses(leverageContractInfo);
    } catch (error) {
      console.error('Failed to refresh leverage contract addresses:', error);
      throw error;
    }
  }

  private async fetchLeverageContractInfo(): Promise<ContractInfoLeverage[]> {
    const configString = await this.appConfigClient.fetchConfigRawString('LeverageContractInfo');
    return JSON.parse(configString);
  }

  private extractLeverageContractAddresses(contracts: ContractInfoLeverage[]): LeverageContractAddresses {
    const addresses: LeverageContractAddresses = {
      positionOpenerAddress: '',
      positionLiquidatorAddress: '',
      positionCloserAddress: '',
      positionExpiratorAddress: '',
    };

    contracts.forEach((contract) => {
      switch (contract.name) {
        case 'PositionOpener':
          addresses.positionOpenerAddress = contract.address;
          break;
        case 'PositionLiquidator':
          addresses.positionLiquidatorAddress = contract.address;
          break;
        case 'PositionCloser':
          addresses.positionCloserAddress = contract.address;
          break;
      }
    });

    return addresses;
  }

  private async refreshPSPContractInfo(): Promise<void> {
    const tmp = await this.appConfigClient.fetchConfigRawString('PSPStrategyInfo')
    this.pspContractInfo = JSON.parse(tmp) as unknown as ContractInfoPSP[];
  }

  private async refreshLastScannedBlock(): Promise<void> {
    const res = await this.appConfigClient.fetchConfigRawString('LastBlockScanned');
    this.lastBlockScanned = parseInt(res, 10);
  }
}
