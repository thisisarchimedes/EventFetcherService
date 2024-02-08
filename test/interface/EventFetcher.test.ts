import {expect} from 'chai';
import {EventFetcherRPC} from '../../src/services/blockchain/EventFetcherRPC';
import dotenv from 'dotenv';

dotenv.config();

describe('Fetch on-chain events from blockchain', function() {
  it('should fetch on-chain events from RPC provider', async function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

    const eventFetcher = new EventFetcherRPC(alchemyRPCURL, infuraRPCURL);

    const blockNumberFrom = 19184910;
    const blockNumberTo = 19184911;

    const onChainEvents = await eventFetcher.getOnChainEvents(blockNumberFrom, blockNumberTo);
    expect(onChainEvents).to.be.an('array');
  });
});

