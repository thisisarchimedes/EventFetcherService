import { ContractType } from './EventDescriptor';

export type ProcessedEvent = {
  name: string;
  contractType: ContractType;
  txHash: string;
  blockNumber: number;
  data: any;
};
