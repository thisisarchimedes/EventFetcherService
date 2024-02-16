import {expect} from 'chai';
import {AppConfig} from '@aws-sdk/client-appconfig';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

describe('Config Service Demo Environment', function() {
  const appName: string = 'DemoEnvironment';
  const configName: string = 'PSPStrategyInfo';
  const environmentName: string = 'Demo';
  const clientId:string = '1';

  beforeEach(async function() {
  });


  it('should get PSP strategies via AWS AppConfig', async function() {
    const res = await getConfig(appName, configName, environmentName, clientId) as ContractInfoPSP[];
    expect(res).to.not.be.undefined;
    expect(res.length).to.be.greaterThan(0);
  });

  async function getConfig(
      appName: string,
      configName: string,
      environmentName: string,
      clientId: string,
  ): Promise<AppConfigResponse | undefined> {
    const client = new AppConfig({region: 'us-east-1'});

    try {
      const response = await client.getConfiguration({
        Application: appName,
        Configuration: configName,
        Environment: environmentName,
        ClientId: clientId,
      });

      if (response.Content) {
        const configString = Buffer.from(response.Content).toString('utf-8');
        return JSON.parse(configString) as AppConfigResponse;
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  }
});


