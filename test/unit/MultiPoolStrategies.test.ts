import {expect} from 'chai';
import nock from 'nock';
import {ethers} from 'ethers';

import {ConfigServiceAdapter} from './adapters/ConfigServiceAdapter';
import {MultiPoolStrategies} from '../../src/MultiPoolStrategies';


describe('MultiPoolStrategies', function() {
  let configService: ConfigServiceAdapter;
  let multiPoolStrategies: MultiPoolStrategies;

  // TBD - complete commented out tests
  // let contractStrategy: any;
  // const addressStrategyFRAXBPalUSD =
  //     '0xB888b8204Df31B54728e963ebA5465A95b695103';

  before(async function() {
    await configureEnvironment();
    const provider = createAlchemyProvider();
    multiPoolStrategies = new MultiPoolStrategies(provider);
    // contractStrategy = getContractStrategy(
    //     provider,
    //     addressStrategyFRAXBPalUSD,
    // );
  });

  async function configureEnvironment() {
    configService = new ConfigServiceAdapter();
    await configService.refreshConfig();
  }

  function createAlchemyProvider(): ethers.providers.JsonRpcProvider {
    const alchemyRPCUrl = configService.getMainRPCURL();
    if (!alchemyRPCUrl) {
      throw new Error(
          'Environment variables for Alchemy RPC URL and API Key must be set.',
      );
    }
    return new ethers.providers.JsonRpcProvider(alchemyRPCUrl);
  }

  // THIS TEST IS TIMING OUT

  // it('should fetch strategy data successfully', async () => {
  //     const underlyingAsset = await fetchUnderlyingAsset(contractStrategy);
  //     const assetDecimals = await fetchAssetDecimals(contractStrategy);
  //     const strategyData = await multiPoolStrategies.fetchStrategyData(
  //         addressStrategyFRAXBPalUSD,
  //     );

  //     expect(strategyData.underlyingAsset).to.equal(underlyingAsset);
  //     console.log('strategyData.assetDecimals', strategyData.assetDecimals);
  //     console.log('assetDecimals', assetDecimals);
  //     expect(strategyData.assetDecimals).to.equal(assetDecimals);
  // });

  it('should fetch the strategy asset price in BTC', async function() {
    const tokenAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const coingeckoTokenId = 'wrapped-bitcoin';
    const btcPrice = 0.123;

    mockCoinGeckoAPI(tokenAddress, coingeckoTokenId, btcPrice);

    const priceInBTC = await multiPoolStrategies.fetchStrategyAssetPriceInBTC(
        tokenAddress,
    );
    expect(priceInBTC).to.equal(btcPrice);

    stopMockingCoinGeckoAPI();
  });

  function mockCoinGeckoAPI(
      tokenAddress: string,
      coingeckoTokenId: string,
      btcPrice: number,
  ) {
    nock('https://api.coingecko.com')
        .persist() // This will persist the mock interceptor
        .get(`/api/v3/coins/ethereum/contract/${tokenAddress}`)
        .reply(200, {id: coingeckoTokenId});

    nock('https://api.coingecko.com')
        .get(
            `/api/v3/simple/price?ids=${coingeckoTokenId}&vs_currencies=btc`,
        )
        .reply(200, {
          [coingeckoTokenId]: {btc: btcPrice},
        });
  }

  function stopMockingCoinGeckoAPI() {
    nock.cleanAll();
  }
});
