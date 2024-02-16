import fs from 'fs';
import util from 'util';

import {ConfigService, LeverageContractAddresses} from '../../src/services/config/ConfigService';
import {ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

const readFile = util.promisify(fs.readFile);

export class ConfigServiceAdapter extends ConfigService {
  private leverageAddressesFile: string;
  private pspInfoFile: string;

  constructor() {
    super('', '', '');
  }

  public async refreshConfig(): Promise<void> {
    await this.refreshLeverageContractAddresses();
    await this.refreshPSPContractInfo();
  }

  public setLeverageAddressesFile(file: string): void {
    this.leverageAddressesFile = file;
  }

  public setPSPInfoFile(file: string): void {
    this.pspInfoFile = file;
  }

  protected async refreshLeverageContractAddresses(): Promise<void> {
    const res = await this.getLeverageContractAddressesFromFile();

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
    const res = await this.getPSPContractInfoFromFile();
    this.pspContractInfo = res;
  }

  private async getLeverageContractAddressesFromFile(): Promise<ContractInfoLeverage[]> {
    const data = await readFile(this.leverageAddressesFile, 'utf-8');
    return JSON.parse(data);
  }

  private async getPSPContractInfoFromFile(): Promise<ContractInfoPSP[]> {
    const data = await readFile(this.pspInfoFile, 'utf-8');
    return JSON.parse(data);
  }
}

