import {ConfigService, LeverageContractAddresses} from './ConfigService';

export class ConfigServiceLocal extends ConfigService {
  public async refreshConfig(): Promise<void> {

    const bucket =  process.env.S3_BUCKET_CONFIG || '';
    const key = process.env.S3_DEPLOYMENT_ADDRESS_KEY || '';

    const res = JSON.parse(await this.fetchS3Object(bucket, key));

    const positionOpenerAddress = res.find((contract) => contract.name === 'PositionOpener');
    const positionLiquidatorAddress = res.find((contract) =>
      contract.name === 'PositionLiquidator');
    const positionCloserAddress = res.find((contract) => contract.name === 'PositionCloser');

    this.leverageContractAddresses = {
      positionOpenerAddress: positionOpenerAddress?.address || '',
      positionLiquidatorAddress: positionLiquidatorAddress?.address || '',
      positionCloserAddress: positionCloserAddress?.address || '',
      positionExpiratorAddress: '',
    };    
  }

}
