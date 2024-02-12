// ConfigServiceParent.ts

import {S3Service} from '@thisisarchimedes/backend-sdk';

export abstract class ConfigService {
  protected readonly s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  protected getEnvironmentConfig(): {
    environment: string;
    configBucket: string;
    rpcKey: string;
    contractAddressesKey: string;
    newEventsQueueURL: string;
    } {
    return {
      environment: process.env.ENVIRONMENT ?? 'local',
      configBucket: process.env.S3_BUCKET_CONFIG ?? '',
      rpcKey: process.env.S3_FORK_KEY ?? '',
      contractAddressesKey: process.env.S3_DEPLOYMENT_ADDRESS_KEY ?? '',
      newEventsQueueURL: process.env.NEW_EVENTS_QUEUE_URL ?? '',
    };
  }


  protected async fetchS3Object(bucket: string, key: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, key);
    return response.toString();
  }
}
