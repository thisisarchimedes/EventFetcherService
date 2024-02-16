import {AppConfig, GetConfigurationCommandOutput} from '@aws-sdk/client-appconfig';

export class AppConfigClient {
  private readonly appConfigClient: AppConfig;
  private readonly environment: string;
  private readonly clientId: string = 'EventFetcherService';

  constructor(environment: string, region: string) {
    this.appConfigClient = new AppConfig({region: region});
    this.environment = environment;
  }

  public async fetchConfig(configName: string): Promise<string> {
    try {
      const response = await this.getConfigFromAppConfig(configName);
      return response;
    } catch (error) {
      throw new Error(`Error fetching configuration for ${configName}: ${error}`);
    }
  }

  private async getConfigFromAppConfig(configName: string): Promise<string> {
    const params = {
      Application: this.environment,
      Configuration: configName,
      Environment: this.environment,
      ClientId: this.clientId,
    };

    const response: GetConfigurationCommandOutput = await this.appConfigClient.getConfiguration(params);

    if (response.Content) {
      return Buffer.from(response.Content).toString('utf-8');
    } else {
      throw new Error(`Configuration ${configName} not found or is empty.`);
    }
  }
}
