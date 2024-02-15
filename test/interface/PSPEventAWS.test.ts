import {expect} from 'chai';
import {ConfigServicePSP} from '../../src/services/config/ConfigServicePSP';


describe('AWS Interface Test', function() {
  it('should be able to read strategy address from the JSON file on AWS S3', async function() {
    const pspConfig = new ConfigServicePSP('smart-contract-backend-config', 'strategies-production.json');

    await pspConfig.refreshStrategyConfig();
    const address = pspConfig.getStrategyConfigByIndex(0)?.strategyAddress;

    expect(address).to.be.an('string');
    expect(address).to.have.lengthOf(42);
  });

  it('should be able to strategy count', async function() {
    const pspConfig = new ConfigServicePSP('smart-contract-backend-config', 'strategies-production.json');

    await pspConfig.refreshStrategyConfig();
    const strategyCount = pspConfig.getStrategyCount();

    expect(strategyCount).to.be.an('number');
    expect(strategyCount).to.be.greaterThan(0);
  });
});

