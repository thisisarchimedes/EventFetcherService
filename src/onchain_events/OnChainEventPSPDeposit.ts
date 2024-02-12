import { ethers } from "ethers";
import { OnChainEvent } from "./OnChainEvent";
import { PSPStrategyConfig } from "../services/config/configServicePSP";
import { Logger } from "@thisisarchimedes/backend-sdk";


export class OnChainEventPSPDeposit extends OnChainEvent {
  private amount: bigint;

  constructor(eventLog: ethers.providers.Log, strategyConfig: PSPStrategyConfig, logger: Logger) {
    super(strategyConfig, logger);

    this.eventName = 'Deposit';
    this.amount = BigInt(0);

    this.parseEventLog(eventLog);
  }

  public process(): void {
    this.logger.info(JSON.stringify({
      event: this.eventName,
      user: this.userAddress,
      strategy: this.strategyConfig.strategyName,
      amount: this.amount.toString(),
    }));
  }

  private parseEventLog(eventLog: ethers.providers.Log): void {
    let address = eventLog.topics[2];
    address = '0x' + address.slice(26);
    this.userAddress = ethers.utils.getAddress(address);

    const amount = eventLog.data.slice(-64);
    this.amount = BigInt('0x' + amount);
  }
}
