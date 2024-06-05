import {expect} from 'chai';
import {EventFetcherRPC} from '../../src/services/blockchain/EventFetcherRPC';
import {ethers} from '@thisisarchimedes/backend-sdk';

describe('Tvl fetcher', function() {
  let alchemyJsonRpcProvider: ethers.providers.JsonRpcProvider;
  let infuraJsonRpcProvider: ethers.providers.JsonRpcProvider;

  beforeEach(function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
    alchemyJsonRpcProvider = new ethers.providers.JsonRpcProvider(
        alchemyRPCURL,
    );
    infuraJsonRpcProvider = new ethers.providers.JsonRpcProvider(infuraRPCURL);
  });

  it('eventFetcher should return the TVL of a strategy', async function() {
    const eventFetcher = new EventFetcherRPC(
        alchemyJsonRpcProvider,
        infuraJsonRpcProvider,
    );

    const tvl = await eventFetcher.getStrategyTvl(
        '0x7694Cd972Baa64018e5c6389740832e4C7f2Ce9a',
    );
    expect(tvl).to.be.not.undefined;
    expect(tvl).to.be.an('string');
  });
});
