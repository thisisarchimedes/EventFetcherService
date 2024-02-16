import {expect} from 'chai';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';
import {AppConfigClient} from '../../src/services/config/AppConfigClient';


describe('Config Service - Demo Environment', function() {
  let appConfigClient: AppConfigClient;

  beforeEach(function() {
    appConfigClient = new AppConfigClient('Demo', 'us-east-1');
  });

  it('should fetch PSP strategies via AWS AppConfig', async function() {
    const strategies = JSON.parse(await appConfigClient.fetchConfig('PSPStrategyInfo')) as ContractInfoPSP[];
    expect(strategies).to.not.be.undefined;
    expect(strategies!.length).to.be.greaterThan(1);
  });
});


