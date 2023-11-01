import { ethers } from 'ethers';

export type IEventScanner = {
    execute(): Promise<void>;
    getLastScannedBlock(): Promise<number>;
    setLastScannedBlock(blockNumber: number): Promise<void>;
};
