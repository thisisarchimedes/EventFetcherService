import { SQS } from 'aws-sdk'

export class SQSService {
  private sqs: SQS

  constructor() {
    this.sqs = new SQS()
  }

  async sendMessage(queueUrl: string, message: string): Promise<void> {
    await this.sqs
      .sendMessage({
        QueueUrl: queueUrl,
        MessageBody: message,
      })
      .promise()
  }
}
