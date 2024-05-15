import {IKMSFetcherService} from '../../../src/services/kms/IKMSFetcherService';
import * as AWS from 'aws-sdk';

export class KMSFetcherServiceAdapter implements IKMSFetcherService {
  private arns: {
    [key: string]: AWS.KMS.TagList
  } = {};

  public fetchTags(arn: string) {
    return Promise.resolve(this.arns[arn]);
  }

  public setTags(arn: string, tag: AWS.KMS.TagList) {
    this.arns[arn] = tag;
  }

  public fetchAllTags() {
    return Promise.resolve(this.arns);
  }
}
