import {SQSService} from '@thisisarchimedes/backend-sdk';

export class SQSServiceAdapter extends SQSService {
  constructor() {
    super();
  }

  public sendMessage(queueUrl: string, message: string): Promise<void> {
    return Promise.resolve();
  }
}
