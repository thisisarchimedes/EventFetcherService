export interface IKMSFetcherService {
    fetchTags(arn: string): Promise<AWS.KMS.TagList>;
}
