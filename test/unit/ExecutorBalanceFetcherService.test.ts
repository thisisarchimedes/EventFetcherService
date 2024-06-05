/* eslint-disable require-await */
import {expect} from 'chai';

import MonitorTrackerService from '../../src/services/balanceFetcher/monitorTracker/MonitorTrackerService';
import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';
import {MonitorTrackerStorageAdapter} from './adapters/MonitorTrackerStorageAdapter';
import {EventFetcherAdapter} from './adapters/EventFetcherAdapter';
import {KMSFetcherServiceAdapter} from './adapters/KMSFetcherServiceAdapter';
import {LoggerAdapter} from './adapters/LoggerAdapter';

describe('LedgerBuilder', function() {
  let configService: ConfigServiceAWS;
  let logger: LoggerAdapter;

  beforeEach(async function() {
    configService = new ConfigServiceAWS('DemoApp', 'us-east-1');
    await configService.refreshConfig();
  });

  afterEach(function() {
  });

  it('Read ETH balance of executors and update db', async function() {
    const eventFetcherAdapter = new EventFetcherAdapter();
    eventFetcherAdapter.setAddressBalance([
      {account: '0x123', balance: 1n},
      {account: '0x456', balance: 2n},
      {account: '0x789', balance: 3n},
    ]);

    const monitorTrackerStorage = new MonitorTrackerStorageAdapter();

    const kmsFetcherService = new KMSFetcherServiceAdapter();
    kmsFetcherService.setTags(configService.getPSPKeyARN(), [{
      TagKey: 'Address',
      TagValue: '0x123',
    }]);
    kmsFetcherService.setTags(configService.getLeverageKeyARN(), [{
      TagKey: 'Address',
      TagValue: '0x456',
    }]);
    kmsFetcherService.setTags(configService.getUrgentKeyARN(), [{
      TagKey: 'Address',
      TagValue: '0x789',
    }]);

    const monitorTracker = new MonitorTrackerService(
        logger,
        configService,
        eventFetcherAdapter,
        monitorTrackerStorage,
        kmsFetcherService,
    );
    await monitorTracker.updateEthBalances();
    const ethBalancesFromDB = await monitorTrackerStorage.getBalances();
    expect(ethBalancesFromDB).to.have.length(3);
    expect(ethBalancesFromDB[0].account).to.be.equal('0x123');
    expect(ethBalancesFromDB[0].balance).to.be.equal('1');
    expect(ethBalancesFromDB[1].account).to.be.equal('0x456');
    expect(ethBalancesFromDB[1].balance).to.be.equal('2');
  });
});
