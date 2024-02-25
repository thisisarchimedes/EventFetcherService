import {ethers} from 'ethers';
import {EventFetcher} from './EventFetcher';


export class EventFetcherRPC extends EventFetcher {
  private readonly mainProvider: ethers.providers.Provider;
  private readonly altProvider: ethers.providers.Provider;

  constructor(mainProviderRPCURL: string, altProviderRPCURL: string) {
    super();
    this.mainProvider = new ethers.providers.JsonRpcProvider(mainProviderRPCURL);
    this.altProvider = new ethers.providers.JsonRpcProvider(altProviderRPCURL);
  }

  public async getOnChainEvents(blockNumberFrom: number,
      blockNumberTo: number,
      topics: string[],
  ): Promise<ethers.providers.Log[]> {
    // RPC URL supports up to 4 topics per request
    const MAX_TOPICS_PER_REQUEST = 4;
    let allLogs: ethers.providers.Log[] = [];

    for (let i = 0; i < topics.length; i += MAX_TOPICS_PER_REQUEST) {
      const chunkTopics = topics.slice(i, i + MAX_TOPICS_PER_REQUEST);
      const filter: ethers.providers.Filter = {
        topics: [chunkTopics],
        fromBlock: blockNumberFrom,
        toBlock: blockNumberTo,
      };
      const chunkLogs = await this.fetchLogsFromBlockchain(filter);
      allLogs = allLogs.concat(chunkLogs);
    }
    return allLogs;
  }

  public async getCurrentBlockNumber(): Promise<number> {
    const [mainBlockNumber, altBlockNumber] = await Promise.all([
      this.mainProvider.getBlockNumber(),
      this.altProvider.getBlockNumber(),
    ]);

    return Math.min(mainBlockNumber, altBlockNumber);
  }

  private async fetchLogsFromBlockchain(filter: ethers.providers.Filter): Promise<ethers.providers.Log[]> {
    try {
      const [mainLogs, altLogs] = await Promise.all([
        this.mainProvider.getLogs(filter),
        this.altProvider.getLogs(filter),
      ]);

      return this.dedupLogsBasedOnTxHashLogIndexAndTopic0([...mainLogs, ...altLogs]);
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }
}
