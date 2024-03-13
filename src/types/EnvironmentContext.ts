export type EnvironmentContext = {
  environment: string;
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  positionExpiratorAddress: string;
  expiredVaultAddress: string;
  lastBlockScanned: number;
  S3_BUCKET: string;
  EVENTS_FETCH_PAGE_SIZE: number;
  S3_LAST_BLOCK_KEY: string;
  rpcAddress: string;
  alternateRpcAddress: string;
};
