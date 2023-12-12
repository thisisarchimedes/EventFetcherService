import { S3Service } from './s3Service';

export class ConfigService {
  private readonly s3: S3Service;

  constructor() {
    this.s3 = new S3Service();
  }

  async getLeverageEngineAddress() {
    //get leverage engine address from config bucket
    let obj = await this.s3.getObject(
      process.env.S3_BUCKET_CONFIG ?? '',
      process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
    );

    let contractAddress = JSON.parse(obj);
    return contractAddress.filter((f: any) => f.name == 'PositionOpener')[0]
      .address;
  }
}
