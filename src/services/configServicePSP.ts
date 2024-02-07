import { S3Service } from '@thisisarchimedes/backend-sdk';

export interface PSPStrategyConfig {
  strategyName: string;
  strategyAddress: string;
}

export class ConfigServicePSP {
  private strategies: PSPStrategyConfig[] = [];
  private readonly s3Service: S3Service;
  private readonly bucketName: string;
  private readonly fileName: string;

  constructor(bucketName: string, fileName: string) {
    this.s3Service = new S3Service();
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

  public getStrategyConfigByIndex(index: number): PSPStrategyConfig | undefined {
    return index >= 0 && index < this.strategies.length ? this.strategies[index] : undefined;
  }

  private async fetchS3Object(bucket: string, file: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, file);
    return response.toString();
  }

  private parseStrategyConfigs(data: string): PSPStrategyConfig[] {
    try {
      const parsedData: any[] = JSON.parse(data);
      return parsedData.map(item => ({
        strategyName: item.strategyName,
        strategyAddress: item.strategyAddress,
      }));
    } catch (error) {
      throw new Error('Failed to parse strategy configurations');
    }
  }

  private updateStrategies(strategies: PSPStrategyConfig[]): void {
    this.strategies = strategies;
  }
}
