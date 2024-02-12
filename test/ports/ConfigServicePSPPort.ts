import { readFile } from 'fs';
import { ConfigServicePSP } from '../../src/services/config/ConfigServicePSP';
import { promises as fsPromises } from 'fs';


export class ConfigServicePSPPort extends ConfigServicePSP {
  constructor(fileName: string) {
    super('bucket', fileName);
  }
  // eslint-disable-next-line require-await
  public async refreshStrategyConfig(): Promise<void> {
    try {
      const fileData = await fsPromises.readFile(this.fileName, 'utf8');
      const strategies = this.parseStrategyConfigs(fileData.toString());
      this.updateStrategies(strategies);
    } catch (error) {
      console.error('Error reading file or refreshing strategy config:', error);
    }
  }

}
