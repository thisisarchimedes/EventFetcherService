import {expect} from 'chai';
import {AppConfig} from '@aws-sdk/client-appconfig';

describe('Config Service Test', function() {
  beforeEach(async function() {
  });


  it('should get PSP strategies via AWS AppConfig', async function() {
    const res = await getConfig('EventFetcherService-Demo', 'PSPStrategyInfo', 'Demo', '1');
    console.log(res);
  });

  async function getConfig(appName: string, configName: string, environmentName: string, clientId: string): Promise<AppConfigResponse | undefined> {
    // Create an AppConfig client
    const client = new AppConfig({region: 'us-east-1'});

    try {
      // Send the command to get the configuration
      const response = await client.getConfiguration({
        Application: appName,
        Configuration: configName,
        Environment: environmentName,
        ClientId: clientId,
      });

      if (response.Content) {
        // Assuming the content is in UTF-8 format
        const configString = Buffer.from(response.Content).toString('utf-8');
        return JSON.parse(configString) as AppConfigResponse;
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error; // Or handle it as needed
    }
  }
});


