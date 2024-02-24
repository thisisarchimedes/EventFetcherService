import {expect} from 'chai';
import {EventFetcherRPC} from '../../src/services/blockchain/EventFetcherRPC';
import dotenv from 'dotenv';
import {ALL_TOPICS} from '../../src/onchain_events/EventTopic';

dotenv.config();

describe('Fetch on-chain events from blockchain', function() {
  it('should fetch on-chain events from RPC provider', async function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

    const eventFetcher = new EventFetcherRPC(alchemyRPCURL, infuraRPCURL);

    const blockNumberFrom = 19184910;
    const blockNumberTo = 19184911;

    const onChainEvents = await eventFetcher.getOnChainEvents(blockNumberFrom, blockNumberTo, ALL_TOPICS);
    expect(onChainEvents).to.be.an('array');
  });

  it('should fetch deposit event of a live strategy', async function() {
    const alchemyRPCURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const infuraRPCURL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

    const eventFetcher = new EventFetcherRPC(alchemyRPCURL, infuraRPCURL);

    const blockNumberFrom = 19000628;
    const blockNumberTo = 19000630;

    const onChainEvents = await eventFetcher.getOnChainEvents(blockNumberFrom, blockNumberTo, ALL_TOPICS);
    expect(onChainEvents.length).to.be.equal(1);

    // eslint-disable-next-line max-len
    const depositEvent = onChainEvents.find((event) => event.topics[0] === '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7');
    expect(depositEvent).to.be.an('object');
    if (depositEvent) {
      expect(depositEvent.blockHash).to.be.eq('0x777690569daf886809ac83b3e8c4c1eb5eba226aca41d3965b5f8395c559f45f');
    }
  });
});
