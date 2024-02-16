import {expect} from 'chai';
import {AppConfig} from '@aws-sdk/client-appconfig';
import {ContractInfoPSP} from '../../src/types/ContractInfoPSP';

const CONFIG = {
  appName: 'DemoEnvironment',
  configName: 'PSPStrategyInfo',
  environmentName: 'Demo',
  clientId: '1',
  region: 'us-east-1',
};

describe('Config Service - Demo Environment', function() {
  it('should fetch PSP strategies via AWS AppConfig', async function() {
    const strategies = await fetchPSPStrategies(CONFIG);
    expect(strategies).to.not.be.undefined;
    expect(strategies!.length).to.be.greaterThan(0);
  });
});


async function fetchPSPStrategies(config: typeof CONFIG): Promise<ContractInfoPSP[] | undefined> {
  try {
    const appConfigResponse = await getConfigFromAppConfig(config);
    return appConfigResponse;
  } catch (error) {
    console.error('Failed to fetch data from app config:', error);
    return undefined;
  }
}

async function getConfigFromAppConfig(config: typeof CONFIG): Promise<ContractInfoPSP[] | undefined> {
  const client = new AppConfig({region: config.region});

  try {
    const response = await client.getConfiguration({
      Application: config.appName,
      Configuration: config.configName,
      Environment: config.environmentName,
      ClientId: config.clientId,
    });

    if (response.Content) {
      const configString = Buffer.from(response.Content).toString('utf-8');
      return JSON.parse(configString) as ContractInfoPSP[];
    }
  } catch (error) {
    throw new Error(`Error fetching configuration: ${error}`);
  }
}
