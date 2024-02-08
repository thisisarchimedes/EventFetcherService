// ConfigServiceParent.ts

import {S3Service} from '@thisisarchimedes/backend-sdk';

export abstract class ConfigService {
  protected readonly s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  protected async fetchS3Object(bucket: string, key: string): Promise<string> {
    const response = await this.s3Service.getObject(bucket, key);
    return response.toString();
  }
}
