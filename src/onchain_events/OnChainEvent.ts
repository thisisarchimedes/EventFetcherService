import { Logger, SQSService } from '@thisisarchimedes/backend-sdk';
import { ConfigService } from '../services/config/ConfigService';
import { ContractInfoPSP } from '../types/ContractInfoPSP';

export abstract class OnChainEvent {
  protected eventName: string = '';
  protected userAddress: string = '';

  protected strategyConfig!: ContractInfoPSP;
  protected depositAmount: bigint = BigInt(0);

  protected logger: Logger;
  protected sqsService: SQSService;
  protected configService: ConfigService;

  constructor(logger: Logger, sqsService: SQSService, configService: ConfigService) {
    this.logger = logger;
    this.sqsService = sqsService;
    this.configService = configService;
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
