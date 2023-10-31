import { SQS } from 'aws-sdk'

export class SQSService {
  private readonly sqs: SQS

  constructor() {
    this.sqs = new SQS()
  }

  async sendMessage(queueUrl: string, message: string): Promise<void> {
    try {
      await this.sqs
        .sendMessage({
          QueueUrl: queueUrl,
          MessageBody: message,
        })
        .promise()
    } catch (e) {
      // Log and re-throw the error, or handle it according to your needs
      if (e instanceof Error) {
        console.error(`Failed to send message to SQS: ${e.message}`)
        throw new Error(`Failed to send message to SQS: ${e.message}`)
      } else {
        console.error(`Failed to send message to SQS: ${e}`)
        throw new Error('Failed to send message to SQS')
      }
    }
  }
}
