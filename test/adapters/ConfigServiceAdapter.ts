import fs from 'fs';
import util from 'util';
import dotenv from 'dotenv';

import {ConfigService, LeverageContractAddresses} from '../../src/services/config/ConfigService';
import {ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

const readFile = util.promisify(fs.readFile);

export class ConfigServiceAdapter extends ConfigService {
  private leverageAddressesFile: string;
  private pspInfoFile: string;

  public async refreshConfig(): Promise<void> {
    await this.refreshLeverageContractAddresses();
    await this.refreshPSPContractInfo();

    dotenv.config();

    this.environment = 'local';
    this.MainRPCURL = process.env.LOCAL_TEST_NODE as string;
    this.AltRPCURL = process.env.LOCAL_TEST_NODE as string;
    this.EventFetchPageSize = 100;
    this.EventQueueURL = 'https://test-queue-url';
    this.leveragePositionDatabaseURL = process.env.DATABASE_URL as string;
  }

  public setLeverageAddressesFile(file: string): void {
    this.leverageAddressesFile = file;
  }

  public setLeverageAddresses(leverageAddresses: LeverageContractAddresses): void {
    this.leverageContractAddresses = leverageAddresses;
  }

  public setPSPInfoFile(file: string): void {
    this.pspInfoFile = file;
  }

  public setLastBlockScanned(blockNumber: number): void {
    this.lastBlockScanned = blockNumber;
  }

  protected async refreshLeverageContractAddresses(): Promise<void> {
    const res = await this.getLeverageContractAddressesFromFile();

    const positionOpenerAddress = res.find((contract: { name: string; }) => contract.name === 'PositionOpener');
    const positionLiquidatorAddress = res.find((contract: { name: string; }) =>
      contract.name === 'PositionLiquidator');
    const positionCloserAddress = res.find((contract: { name: string; }) => contract.name === 'PositionCloser');
    const positionExpiratorAddress = res.find((contract: { name: string; }) => contract.name === 'positionExpirator');

    this.leverageContractAddresses = {
      positionOpenerAddress: positionOpenerAddress?.address || '',
      positionLiquidatorAddress: positionLiquidatorAddress?.address || '',
      positionCloserAddress: positionCloserAddress?.address || '',
      positionExpiratorAddress: positionExpiratorAddress?.address || '',
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

  public setLastScannedBlock(blockNumber: number): Promise<void> {
    this.lastBlockScanned = blockNumber;
    return Promise.resolve();
  }

  public setMaxNumberOfBlocksToProess(maxBlocks: number): void {
    this.MaxNumberOfBlocksToProess = maxBlocks;
  }
}

