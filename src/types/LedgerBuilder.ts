export type OpenPositionEvent = {
  name: string;
  txHash: string;
  blockNumber: number;
  data: {
      nftId: string;
      user: string;
      strategy: string;
      collateralAmount: string;
      wbtcToBorrow: string;
      positionExpireBlock: number;
      sharesReceived: string;
  };
};
export type ClosePositionEvent = {
  name: string;
  txHash: string;
  blockNumber: number;
  data: {
      nftId: string;
      user: string;
      receivedAmount: string;
      wbtcDebtAmount: string;
  };
};
export type LiquidatePositionEvent = {
  name: string;
  txHash: string;
  blockNumber: number;
  data: {
      nftId: string;
      strategy: string;
      wbtcDebtPaid: string;
      claimableAmount: string;
      liquidationFee: string;
  };
};

export type ExpirePositionEvent = {
  name: string;
  txHash: string;
  blockNumber: number;
  data: {
      nftId: string;
      user: string;
      claimableAmount: string;
  };
};

export type ClaimEvent = {
  name: string;
  txHash: string;
  blockNumber: number;
  data: {
      claimer: string;
      nftId: string;
      amount: string;
  };
};

export type StrategyData = {
  assetPerShare: bigint;
  underlyingAsset: string;
  assetDecimals: bigint;
};
