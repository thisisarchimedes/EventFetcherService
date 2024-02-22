import {Logger, SQSService} from '@thisisarchimedes/backend-sdk';
import {ConfigService} from '../services/config/ConfigService';
import {ContractInfoPSP} from '../types/ContractInfoPSP';
import {ethers} from 'ethers';

export abstract class OnChainEvent {
  protected eventName: string = '';
  protected userAddress: string = '';

  protected strategyConfig!: ContractInfoPSP;
  protected depositAmount: bigint = BigInt(0);

  protected txHash: string = '';
  protected blockNumber: number = 0;

  protected logger: Logger;
  protected sqsService: SQSService;
  protected configService: ConfigService;

  constructor(rawEventLog: ethers.providers.Log, logger: Logger, sqsService: SQSService, configService: ConfigService) {
    this.logger = logger;
    this.sqsService = sqsService;
    this.configService = configService;

    this.txHash = rawEventLog.transactionHash;
    this.blockNumber = rawEventLog.blockNumber;
  }

  abstract process(): void;

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
