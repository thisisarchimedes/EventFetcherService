import fs from 'fs';
import util from 'util';

import {ConfigService, LeverageContractAddresses} from '../../src/services/config/ConfigService';
import {ContractAddress} from '../../src/types/ContractAddress';

const readFile = util.promisify(fs.readFile);

export class ConfigServiceAdapter extends ConfigService {
  private leverageAddressesFile: string;

  public async refreshConfig(): Promise<void> {
    await this.refreshLeverageContractAddresses();
  }

  public setLeverageAddressesFile(file: string): void {
    this.leverageAddressesFile = file;
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

  private async getLeverageContractAddressesFromFile(): Promise<ContractAddress[]> {
    const data = await readFile(this.leverageAddressesFile, 'utf-8');
    return JSON.parse(data);
  }
}

