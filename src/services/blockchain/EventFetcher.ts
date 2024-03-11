import {ethers} from '@thisisarchimedes/backend-sdk';

export abstract class EventFetcher {
    public abstract getOnChainEvents(
        blockNumberFrom: number,
        blockNumberTo: number,
        topics: string[]
    ): Promise<ethers.Log[]>;

    protected dedupLogsBasedOnTxHashLogIndexAndTopic0(logs: ethers.Log[]): ethers.Log[] {
      const uniqueLogs = new Map<string, ethers.Log>();

      for (const log of logs) {
        const uniqueKey = log.transactionHash + log.index + log.topics[0];
        if (!uniqueLogs.has(uniqueKey)) {
          uniqueLogs.set(uniqueKey, log);
        }
      }

      const res = Array.from(uniqueLogs.values());
      return res;
    }
}
