import {ethers} from 'ethers';

export abstract class EventFetcher {
    public abstract getOnChainEvents(
        blockNumberFrom: number,
        blockNumberTo: number,
        topics: string[]
    ): Promise<ethers.providers.Log[]>;

    protected dedupLogsBasedOnTxHashLogIndexAndTopic0(logs: ethers.providers.Log[]): ethers.providers.Log[] {
      const uniqueLogs = new Map<string, ethers.providers.Log>();

      for (const log of logs) {
        const uniqueKey = log.transactionHash + log.logIndex + log.topics[0];
        if (!uniqueLogs.has(uniqueKey)) {
          uniqueLogs.set(uniqueKey, log);
        }
      }

      const res = Array.from(uniqueLogs.values());
      return res;
    }

    public abstract getAddressBalance (address: string): Promise<bigint>;

    public abstract getStrategyTvl (address: string): Promise<bigint>;
}
