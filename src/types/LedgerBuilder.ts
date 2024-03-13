import {BigNumber} from 'ethers';
import {ContractType} from './EventDescriptor';

export type BaseEvent = {
  name: string;
  contractType: ContractType;
  txHash: string;
  blockNumber: number;
}

export type OpenPositionEvent = BaseEvent & {
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

export type ClosePositionEvent = BaseEvent & {
  data: {
      nftId: string;
      user: string;
      receivedAmount: string;
      wbtcDebtAmount: string;
  };
};

export type LiquidatePositionEvent = BaseEvent & {
  data: {
      nftId: string;
      strategy: string;
      wbtcDebtPaid: string;
      claimableAmount: string;
      liquidationFee: string;
  };
};

export type ExpirePositionEvent = BaseEvent & {
  data: {
      nftId: string;
      user: string;
      claimableAmount: string;
  };
};

export type ClaimEvent = BaseEvent & {
  data: {
      claimer: string;
      nftId: string;
      amount: string;
  };
};

export type StrategyData = {
  assetPerShare: BigNumber;
  underlyingAsset: string;
  assetDecimals: number;
};
