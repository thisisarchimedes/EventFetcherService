import { ethers } from 'ethers';

export type IEventProcessorService = {
  execute(): Promise<void>;
  getLastScannedBlock(): Promise<number>;
  setLastScannedBlock(blockNumber: number): Promise<void>;
};
