export enum ContractType {
  Opener = 0,
  Closer = 1,
  Liquidator = 2,
  Expirator = 3,
}

export type EventDescriptor = {
  name: string;
  signature: string;
  contractType: ContractType;
  decodeData: {
    name: string;
    type: string;
    indexed: boolean;
  }[];
};
