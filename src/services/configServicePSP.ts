import {S3Service} from '@thisisarchimedes/backend-sdk';

export type PSPStrategyConfig = {
    strategyName: string;
    strategyAddress: string; 
};

export class ConfigServicePSP {
  private strategies: PSPStrategyConfig[];
  private readonly s3: S3Service;
  private readonly bucketName: string;
  private readonly fileName: string;

  constructor(bucketName: string, fileName: string) {
    this.s3 = new S3Service();
    this.bucketName = bucketName;
    this.fileName = fileName;
    this.strategies = []; // Initialize the strategies array
  }

  async refreshStrategyConfig() {
    try {
      const tmp = await this.s3.getObject(this.bucketName, this.fileName);
      const jsonObj = JSON.parse(tmp.toString()); 

      this.strategies = [];

      // Iterate through the JSON array and create a PSPStrategyConfig object for each entry
      jsonObj.forEach((item: any) => {
        this.strategies.push({
          strategyName: item.strategyName,
          strategyAddress: item.strategyAddress, // Assuming you want the strategyAddress here
        });
      });
    } catch (error) {
      console.error('Error refreshing strategy config:', error);
    }
  }

  getStrategyConfigByIndex(index: number): PSPStrategyConfig | undefined {
    // Fix: Return from the strategies array, and change type from 'integer' to 'number'
    // Also, handle out-of-bounds by returning undefined if index is not valid
    if (index >= 0 && index < this.strategies.length) {
      return this.strategies[index];
    }
    return undefined;
  }
}
