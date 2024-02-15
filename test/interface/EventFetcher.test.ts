import {expect} from 'chai';
import {EventFetcherRPC} from '../../src/services/blockchain/EventFetcherRPC';
import dotenv from 'dotenv';

dotenv.config();

describe('Fetch on-chain events from blockchain', function() {
  it('should fetch on-chain events from RPC provider', async function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

    console.log('alchemyRPCURL:', alchemyRPCURL);
    console.log('infuraRPCURL:', infuraRPCURL);
    const eventFetcher = new EventFetcherRPC(alchemyRPCURL, infuraRPCURL);

    const blockNumberFrom = 19184910;
    const blockNumberTo = 19184911;

    const onChainEvents = await eventFetcher.getOnChainEvents(blockNumberFrom, blockNumberTo);
    expect(onChainEvents).to.be.an('array');
  });

  it('should fetch deposit event of crvUSD/USDT strategy', async function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

    const eventFetcher = new EventFetcherRPC(alchemyRPCURL, infuraRPCURL);

    const blockNumberFrom = 19178316;
    const blockNumberTo = 19178316;

    const onChainEvents = await eventFetcher.getOnChainEvents(blockNumberFrom, blockNumberTo);
    // eslint-disable-next-line max-len
    const depositEvent = onChainEvents.find((event) => event.topics[0] === '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7');

    expect(depositEvent).to.be.an('object');
    if (depositEvent) {
      expect(depositEvent.blockHash).to.be.eq('0xb9fae1e0030443598e1d2e924d29c1f691535c8d03990fb95abf808591364986');
    }
  });
});
