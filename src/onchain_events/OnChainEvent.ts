import { ethers } from 'ethers';

import { ConfigService } from '../services/config/ConfigService';
import { ContractInfoPSP } from '../types/ContractInfoPSP';
import { EventFetcherMessage } from '../types/EventFetcherMessage';
import { Logger } from '../services/logger/Logger';

export abstract class OnChainEvent {
  protected eventName: string = '';
  protected userAddress: string = '';
  protected txHash: string = '';
  protected blockNumber: number = 0;

  protected strategyConfig!: ContractInfoPSP | { strategyName: string };
  protected logger: Logger;
  protected configService: ConfigService;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, configService: ConfigService) {
    this.logger = logger;
    this.configService = configService;

    this.txHash = rawEventLog.transactionHash;
    this.blockNumber = rawEventLog.blockNumber;
  }

  abstract process(): EventFetcherMessage | undefined;

  public getEventName(): string {
    return this.eventName;
  }
}
