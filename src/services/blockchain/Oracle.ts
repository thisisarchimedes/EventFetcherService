import {ethers} from 'ethers';
import {ConfigService} from '../config/ConfigService';

export abstract class Oracle {
  protected readonly configService: ConfigService;
  protected readonly mainProvider: ethers.providers.Provider;
  protected readonly altProvider: ethers.providers.Provider;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.mainProvider = new ethers.providers.JsonRpcProvider(configService.getMainRPCURL());
    this.altProvider = new ethers.providers.JsonRpcProvider(configService.getAlternativeRPCURL());
  }

  public abstract getTokenPrice(): Promise<number>;
}
