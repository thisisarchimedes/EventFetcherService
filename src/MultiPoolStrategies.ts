import {ethers} from 'ethers';
import {StrategyData} from './types/LedgerBuilder';
import {
  Contracts,
  CoinGeckoClient,
  EthereumAddress,
} from '@thisisarchimedes/backend-sdk';
export class MultiPoolStrategies {
  private readonly alchemyProvider: ethers.providers.Provider;
  private strategyDatas: Record<string, StrategyData>;
  private coingeckoTokenIds: Record<string, string>;
  private tokenPricesInBTC: Record<string, number>;
  private readonly coinGeckoClient: CoinGeckoClient;

  constructor(rpcProvider: ethers.providers.JsonRpcProvider) {
    this.alchemyProvider = rpcProvider;
    this.strategyDatas = {};
    this.coingeckoTokenIds = {};
    this.tokenPricesInBTC = {};
    this.coinGeckoClient = new CoinGeckoClient();
  }

  async fetchStrategyData(strategy: string): Promise<StrategyData> {
    // check if in cache
    if (this.strategyDatas[strategy]) {
      return this.strategyDatas[strategy];
    }

    const strategyContract = Contracts.general.multiPoolStrategy(
        new EthereumAddress(strategy),
        this.alchemyProvider,
    );

    const underlyingAsset = await strategyContract.asset();
    // eslint-disable-next-line new-cap
    const assetContract = Contracts.general.erc20(
        new EthereumAddress(strategy),
        this.alchemyProvider,
    );

    const assetDecimals = await assetContract.decimals();
    const assetPerShare = await strategyContract.convertToAssets(
        ethers.utils.parseUnits('1', assetDecimals),
    );

    return {
      assetPerShare,
      underlyingAsset,
      assetDecimals,
    };
  }
  async fetchCoingeckoTokenId(tokenAddress: string): Promise<string | null> {
    if (this.coingeckoTokenIds[tokenAddress]) {
      return null;
    }
    const response = await this.coinGeckoClient.getTokenData(new EthereumAddress(tokenAddress));
    this.coingeckoTokenIds[tokenAddress] = response.id;

    return response.id;
  }
  async fetchStrategyAssetPriceInBTC(tokenAddress: string): Promise<number> {
    if (this.tokenPricesInBTC[tokenAddress]) {
      return this.tokenPricesInBTC[tokenAddress];
    }
    const coingeckoTokenId = await this.fetchCoingeckoTokenId(tokenAddress);
    if (coingeckoTokenId) {
      const priceInBTC = await this.coinGeckoClient.getTokenPrice(
          coingeckoTokenId,
          'btc',
      );
      this.tokenPricesInBTC[tokenAddress] = priceInBTC;
      return priceInBTC;
    }
    return 0;
  }
}

