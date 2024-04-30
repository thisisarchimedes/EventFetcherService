import * as AWS from 'aws-sdk';

export class KMSFetcherService {
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
