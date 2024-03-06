import {SQSService} from '@thisisarchimedes/backend-sdk';

export class SQSServiceAdapter extends SQSService {
  private latestMessage: string;

  public sendMessage(queueUrl: string, message: string): Promise<void> {
    this.latestMessage = message;
    return Promise.resolve();
  }

  public getLatestMessage(): string {
    return this.latestMessage;
  }
}
