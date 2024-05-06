import * as AWS from 'aws-sdk';
import {IKMSFetcherService} from './IKMSFetcherService';

export class KMSFetcherService implements IKMSFetcherService {
  private kms: AWS.KMS = new AWS.KMS();

  public async fetchTags(arn: string) {
    const params = {
      KeyId: arn,
    };

    const tagsResponse = await this.kms.listResourceTags(params).promise();
    if (tagsResponse.Tags === undefined) {
      // log
      throw new Error('No tags found');
    }

    return tagsResponse.Tags;
  }
}
