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

  private async refreshLeverageContractAddresses(): Promise<void> {
    let positionOpenerAddress: string = '';
    let positionLiquidatorAddress: string = '';
    let positionCloserAddress: string = '';

    const tmp = await this.appConfigClient.fetchConfigRawString('LeverageContractInfo');
    const res = JSON.parse(tmp) as unknown as ContractInfoLeverage[];

    for (let i = 0; i < res.length; i++) {
      const contract = res[i];
      if (contract['name'] === 'PositionOpener') {
        positionOpenerAddress = contract['address'];
      } else if (contract['name'] === 'PositionLiquidator') {
        positionLiquidatorAddress = contract['address'];
      } else if (contract['name'] === 'PositionCloser') {
        positionCloserAddress = contract['address'];
      }
    }

    this.leverageContractAddresses = {
      positionOpenerAddress: positionOpenerAddress,
      positionLiquidatorAddress: positionLiquidatorAddress,
      positionCloserAddress: positionCloserAddress,
      positionExpiratorAddress: '',
    } as LeverageContractAddresses;

    console.log('Leverage contract addresses:', this.leverageContractAddresses);
  }

  private async refreshPSPContractInfo(): Promise<void> {
    this.pspContractInfo = await this.appConfigClient.fetchConfigRawString('PSPStrategyInfo') as unknown as ContractInfoPSP[];
  }

  private async refreshLastScannedBlock(): Promise<void> {
    const res = await this.appConfigClient.fetchConfigRawString('LastBlockScanned');
    this.lastBlockScanned = parseInt(res, 10);
  }
}
