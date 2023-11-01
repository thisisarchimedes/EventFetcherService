import { S3 } from 'aws-sdk';

export class S3Service {
    private readonly s3: S3;

    constructor() {
        this.s3 = new S3();
    }

    async getObject(bucket: string, key: string): Promise<string> {
        try {
            const data = await this.s3
                .getObject({ Bucket: bucket, Key: key })
                .promise();
            return data.Body!.toString();
        } catch (e) {
            if (e instanceof Error) {
                throw new Error(`Failed to get object from S3: ${e.message}`);
            }
        }

        return '';
    }

    async putObject(bucket: string, key: string, body: string): Promise<void> {
        try {
            await this.s3
                .putObject({
                    Bucket: bucket,
                    Key: key,
                    Body: body,
                })
                .promise();
        } catch (e) {
            if (e instanceof Error) {
                console.error(`Failed to put object into S3: ${e.message}`);
                throw new Error(`Failed to put object into S3: ${e.message}`);
            } else {
                console.error(`FFailed to put object into S3: ${e}`);
                throw new Error('Failed to put object into S3');
            }
        }
    }
}
