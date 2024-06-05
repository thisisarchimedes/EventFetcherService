/* eslint-disable require-await */
import {expect} from 'chai';

import {TvlFetcherService} from '../../src/services/tvlFetcher/TvlFetcherService';
import {EventFetcherAdapter} from './adapters/EventFetcherAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';
import {TvlFectherStorageAdapter} from './adapters/TvlFetcherStorageAdapter';

describe('TvlFectherService', function() {
  let logger: LoggerAdapter;

  it('Read strategy tvls from event fetcher and writes them to DB', async function() {
    const eventFetcherAdapter = new EventFetcherAdapter();
    eventFetcherAdapter.setStrategyTvl([
      {account: '0x123', balance: '1'},
      {account: '0x456', balance: '2'},
      {account: '0x789', balance: '3'},
    ]);

    const tlvFetcherStorage = new TvlFectherStorageAdapter();

    const tlvTracker = new TvlFetcherService(
        logger,
        eventFetcherAdapter,
        tlvFetcherStorage,
    );
    await tlvTracker.updateStrategyTvls(['0x123', '0x456', '0x789']);
    const tvlsFromDb = await tlvFetcherStorage.getTvls();
    expect(tvlsFromDb).to.have.length(3);
    expect(tvlsFromDb[0].account).to.be.equal('0x123');
    expect(tvlsFromDb[0].balance).to.be.equal('1');
    expect(tvlsFromDb[1].account).to.be.equal('0x456');
    expect(tvlsFromDb[1].balance).to.be.equal('2');
  });
});
