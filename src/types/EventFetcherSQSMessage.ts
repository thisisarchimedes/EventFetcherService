import {ContractType} from './EventDescriptor';

export type EventFetcherSQSMessage = {
  name: string;
  contractType: ContractType;
  txHash: string;
  blockNumber: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};
