export interface IEventScanner {
  getLastScannedBlock(): Promise<number>
  setLastScannedBlock(blockNumber: number): Promise<void>
  scanEvents(): Promise<void>
}
