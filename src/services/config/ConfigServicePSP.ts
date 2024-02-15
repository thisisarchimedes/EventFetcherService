import {ConfigService} from './ConfigService';

export interface IPSPStrategyConfig {
  strategyName: string;
  strategyAddress: string;
}


export class ConfigServicePSP extends ConfigService {
  protected strategies: IPSPStrategyConfig[] = [];
  protected readonly bucketName: string;
  protected readonly fileName: string;


  constructor(bucketName: string, fileName: string) {
    super();
    this.bucketName = bucketName;
    this.fileName = fileName;
  }

  public async refreshStrategyConfig(): Promise<void> {
    try {
      const objectData = await this.fetchS3Object(this.bucketName, this.fileName);
      const strategies = this.parseStrategyConfigs(objectData);
      this.updateStrategies(strategies);
    } catch (error) {
      // TODO: Log line
      console.error('Error refreshing strategy config:', error);
    }
  }

  public getStrategyConfigByIndex(index: number): IPSPStrategyConfig | undefined {
    return index >= 0 && index < this.strategies.length ? this.strategies[index] : undefined;
  }

  public getStrategyCount(): number {
    return this.strategies.length;
  }

  protected parseStrategyConfigs(data: string): IPSPStrategyConfig[] {
    try {
      const parsedData = JSON.parse(data) as IPSPStrategyConfig[];
      return parsedData.map((item) => ({
        strategyName: item.strategyName,
        strategyAddress: item.strategyAddress,
      }));
    } catch (error) {
      throw new Error('Failed to parse strategy configurations');
    }
  }

  protected updateStrategies(strategies: IPSPStrategyConfig[]): void {
    this.strategies = strategies;
  }
}
