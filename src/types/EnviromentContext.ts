export type EnviromentContext = {
  enviroment: string;
  positionOpenerAddress: string;
  positionLiquidatorAddress: string;
  positionCloserAddress: string;
  S3_BUCKET: string;
  S3_LAST_BLOCK_KEY: string;
  EVENTS_FETCH_PAGE_SIZE: number;
  NEW_EVENTS_QUEUE_URL: string;
  rpcAddress: string;
  alternateRpcAddress: string;
};
