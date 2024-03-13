import {ContractInfoLeverage} from '../../types/ContractInfoLeverage';
import {ContractInfoPSP} from '../../types/ContractInfoPSP';
import {ConfigService, LeverageContractAddresses} from './ConfigService';
import {AppConfigClient} from './AppConfigClient';
import {S3Service} from '@thisisarchimedes/backend-sdk';

export class ConfigServiceAWS extends ConfigService {
  private readonly appConfigClient: AppConfigClient;
  private readonly s3Service: S3Service = new S3Service();

  constructor(environment: string, region: string) {
    super();
    this.environment = environment;
    this.appConfigClient = new AppConfigClient(environment, region);
  }

  public async refreshConfig(): Promise<void> {
    await Promise.all([
      this.refreshLeverageContractAddresses(),
      this.refreshPSPContractInfo(),
      this.refreshLastScannedBlock(),
      this.refreshRPCURL(),
      this.refreshEventFetchPageSize(),
    ]);
  }

  public async setLastScannedBlock(blockNumber: number): Promise<void> {
    const res = JSON.parse(await this.appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));
    await this.s3Service.putObject(res['bucket'], res['key'], blockNumber.toString());
    this.lastBlockScanned = blockNumber;
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
        case 'positionExpirator':
          addresses.positionExpiratorAddress = contract.address;
          break;
      }
    });

    return addresses;
  }

  private async refreshPSPContractInfo(): Promise<void> {
    const res = await this.appConfigClient.fetchConfigRawString('PSPStrategyInfo');
    this.pspContractInfo = JSON.parse(res) as unknown as ContractInfoPSP[];
  }

  private async refreshLastScannedBlock(): Promise<void> {
    const res = JSON.parse(await this.appConfigClient.fetchConfigRawString('LastBlockScannedS3FileURL'));
    const blockNumber = await this.s3Service.getObject(res['bucket'], res['key']);
    this.lastBlockScanned = parseInt(blockNumber, 10);
  }

  private async refreshRPCURL(): Promise<void> {
    const [mainRPCURL, altRPCURL] = await Promise.all([
      this.appConfigClient.fetchConfigRawString('RpcUrl'),
      this.appConfigClient.fetchConfigRawString('AltRpcUrl'),
    ]);

    this.MainRPCURL = mainRPCURL;
    this.AltRPCURL = altRPCURL;
  }

  private async refreshEventFetchPageSize(): Promise<void> {
    const res = await this.appConfigClient.fetchConfigRawString('EventsFetchPageSize');
    this.EventFetchPageSize = parseInt(res, 10);
  }
}
