import {ConfigService} from './ConfigService';

export class ConfigServiceLocal extends ConfigService {
  public async refreshConfig(): Promise<void> {
    await this.refreshLeverageContractAddresses();
  }
}
