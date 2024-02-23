import { ethers } from 'ethers';
import { EventFetcher } from '../../src/services/blockchain/eventFetcher';
import fs from 'fs';

export class EventFetcherAdapter extends EventFetcher {
  private events: ethers.providers.Log[];

  constructor() {
    super();
    this.events = [];
  }
  // eslint-disable-next-line require-await, @typescript-eslint/no-unused-vars
  public async getOnChainEvents(blockNumberFrom: number, blockNumberTo: number): Promise<ethers.providers.Log[]> {
    return this.dedupLogsBasedOnTxHashLogIndexAndTopic0AndTopic0(this.events);
  }

  public setEventArrayFromFile(fileName: string): void {
    try {
      const data = fs.readFileSync(fileName, 'utf8');
      this.events = JSON.parse(data) as ethers.providers.Log[];
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
    }
  }
}
