import {ethers} from 'ethers';
import {EventFetcher} from './eventFetcher';


export class EventFetcherRPC implements EventFetcher {
  private readonly mainProvider: ethers.providers.Provider;
  private readonly altProvider: ethers.providers.Provider;

  constructor(mainProviderRPCURL: string, altProviderRPCURL: string) {
    this.mainProvider = new ethers.providers.JsonRpcProvider(mainProviderRPCURL);
    this.altProvider = new ethers.providers.JsonRpcProvider(altProviderRPCURL);
  }

  public async getOnChainEvents(blockNumberFrom: number, blockNumberTo: number): Promise<ethers.providers.Log[]> {
    const filter: ethers.providers.Filter = {
      fromBlock: blockNumberFrom,
      toBlock: blockNumberTo,
    };

    // TODO: add topics to the filter to only fetch the events we are interested in

    const logs = await this.fetchLogsFromBlockchain(filter);
    return logs;
  }


  private async fetchLogsFromBlockchain(
      filter: ethers.providers.Filter,
  ): Promise<ethers.providers.Log[]> {
    const [alchemyLogs, infuraLogs] = await Promise.all([
      this.mainProvider.getLogs(filter),
      this.altProvider.getLogs(filter),
    ]);

    return this.deduplicateLogs([...alchemyLogs, ...infuraLogs]);
  }

  private deduplicateLogs(logs: ethers.providers.Log[]): ethers.providers.Log[] {
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
