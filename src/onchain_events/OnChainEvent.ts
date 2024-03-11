import {Logger, ethers} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../services/config/ConfigService';
import {ContractInfoPSP} from '../types/ContractInfoPSP';
import {EventFetcherMessage} from '../types/EventFetcherMessage';

export abstract class OnChainEvent {
  protected eventName: string = '';
  protected userAddress: string = '';
  protected txHash: string = '';
  protected blockNumber: number = 0;

  protected strategyConfig!: ContractInfoPSP;
  protected logger: Logger;
  protected configService: ConfigService;

  constructor(rawEventLog: ethers.Log, logger: Logger, configService: ConfigService) {
    this.logger = logger;
    this.configService = configService;

    this.txHash = rawEventLog.transactionHash;
    this.blockNumber = rawEventLog.blockNumber;
  }

  abstract process(): EventFetcherMessage|undefined;

  public getEventName(): string {
    return this.eventName;
  }

  protected findStrategyConfigBStrategyAddress(strategyAddress: string): ContractInfoPSP {
    const res = this.configService.getPSPStrategyInfoByAddress(strategyAddress);
    if (res === undefined) {
      throw new Error(`Unknown strategy address: ${strategyAddress}`);
    }

    return res;
  }
}
