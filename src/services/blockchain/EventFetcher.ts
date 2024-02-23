import {ethers} from 'ethers';

export abstract class EventFetcher {
    public abstract getOnChainEvents(
        blockNumberFrom: number,
        blockNumberTo: number,
        topics: string[]
    ): Promise<ethers.providers.Log[]>;

    protected deduplicateLogs(logs: ethers.providers.Log[]): ethers.providers.Log[] {
      const uniqueLogs = new Map<string, ethers.providers.Log>();

      for (const log of logs) {
        const uniqueKey = log.transactionHash + log.logIndex;
        if (!uniqueLogs.has(uniqueKey)) {
          uniqueLogs.set(uniqueKey, log);
        }
      }

      return Array.from(uniqueLogs.values());
    }
}
