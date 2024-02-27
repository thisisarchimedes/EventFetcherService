import {expect} from 'chai';

import {ConfigServiceAWS} from '../../src/services/config/ConfigServiceAWS';

describe('Leverage DB Service', function() {
  let leverageDBService: LeverageDBService;
  let configService: ConfigServiceAWS;

  before(function() {
    const environment = process.env.ENVIRONMENT as string;
    const region = process.env.AWS_REGION as string;

    configService = new ConfigServiceAWS(environment, region);
    configService.refreshConfig();
  });

  beforeEach(function() {
    leverageDBService = new LeverageDBService();
  });

  it('should record OpenLeverage event to DB', async function() {
    expect(actualItem).to.not.be.null;
    expect(actualItem).to.equal(expectedItem);
  });
});
