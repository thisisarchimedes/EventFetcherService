export interface ContractInfoPSP {
    strategyName: string;
    strategyAddress: string;
    adapterAddress: string;
    adapterType: number;
    adjustInThreshold: bigint;
    lpSlippage: number;
    doHardWorkThreshold: number;
    extraRewardsTokens: string[];
    adjustOutThreshold: number;
    hoursNeedsPassSinceLastAdjustOut: number;
    hoursNeedsPassSinceLastAdjustIn: number;
    adjustOutUnderlyingSlippage: number;
    maximumPoolOwnershipRatio: number;
    curvePoolABIVersion: string;
    basePoolAddress: string;
    basePoolLpTokenAddress: string;
    basePoolTokensLength: number;
    maxSlippage: number;
    haveZapper: boolean;
    isVolatile: boolean;
    maxVolatilityPercentage: number;
    minVolatilityPercentage: number;
}
