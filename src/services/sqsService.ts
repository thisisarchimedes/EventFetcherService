import { SQS } from 'aws-sdk';

export class SQSService {
    private readonly sqs: SQS;

    constructor() {
        this.sqs = new SQS();
    }

    async sendMessage(queueUrl: string, messageBody: any): Promise<void> {
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(messageBody),
        };

        try {
            await this.sqs.sendMessage(params).promise();
        } catch (error) {
            if (error instanceof Error)
                throw new Error(
                    `Failed to send message to SQS: ${error.message}`,
                );
        }
    }
}
