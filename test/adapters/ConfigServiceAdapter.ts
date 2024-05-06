import fs from 'fs';
import util from 'util';
import dotenv from 'dotenv';

import {ConfigService, LeverageContractAddresses} from '../../src/services/config/ConfigService';
import {ContractInfoLeverage} from '../../src/types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';

const readFile = util.promisify(fs.readFile);

dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT!;
const AWS_REGION = process.env.AWS_REGION!;

export class ConfigServiceAdapter extends ConfigService {
  private leverageAddressesFile: string;
  private pspInfoFile: string;
  private readonly appConfigClient: AppConfigClient;
  private readonly awsRegion: string;

  constructor() {
    super();
    this.environment = ENVIRONMENT;
    this.awsRegion = AWS_REGION;
    this.appConfigClient = new AppConfigClient(this.environment, this.awsRegion);
  }

  public getAwsRegion = (): string => this.awsRegion;

  public async getLastBlockScannedParameters():Promise<{bucket: string, key: string}> {
    return JSON.parse(await this.appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));
  }

  public async refreshConfig(): Promise<void> {
    await this.refreshLeverageContractAddresses();
    await this.refreshPSPContractInfo();
    await this.refreshPSPContractInfo();

    dotenv.config();

    this.environment = 'DemoApp';
    this.MainRPCURL = process.env.LOCAL_TEST_NODE as string;
    this.AltRPCURL = process.env.LOCAL_TEST_NODE as string;
    this.EventFetchPageSize = 100;
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

  private async refreshPSPContractInfo(): Promise<void> {
    const res = await this.appConfigClient.fetchConfigRawString('PSPStrategyInfo');
    this.pspContractInfo = JSON.parse(res) as unknown as ContractInfoPSP[];
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
        case 'PositionExpirator':
          addresses.positionExpiratorAddress = contract.address;
          break;
      }
    });

    return addresses;
  }
}

