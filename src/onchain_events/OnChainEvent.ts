import {Logger} from "@thisisarchimedes/backend-sdk";
import {PSPStrategyConfig} from "../services/config/configServicePSP";

export class OnChainEvent {

  protected eventName: string; 
  protected strategyConfig: PSPStrategyConfig;
  protected logger: Logger;

  protected userAddress: string;

  
  constructor(strategyConfig: PSPStrategyConfig, logger: Logger) {
    this.strategyConfig = strategyConfig;
    this.logger = logger;
  }

  public process(): void {
    // Intentionally empty method.
  }
}
