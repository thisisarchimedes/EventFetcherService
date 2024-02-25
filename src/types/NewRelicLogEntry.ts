export interface NewRelicLogEntry {
    environment: string;
    message: EventFetcherLogEntryMessage;
    level: string;
    timestamp: number;
    service: string;
}

export interface EventFetcherLogEntryMessage {
    blockNumber: number;
    txHash: string;
    event: string;
    strategy: string;
    user?: string;
}

export interface EventFetcherLogEntryMessagePSP extends EventFetcherLogEntryMessage {
    amountAddedToStrategy: string;
    amountAddedToAdapter: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventSpecificData?: any;
}

export interface EventFetcherLogEntryMessageLeverage extends EventFetcherLogEntryMessage {
    nftID: number;
    collateralAddedToStrategy: string;
    debtBorrowedFromProtocol: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventSpecificData?: any;
}

export interface EventSpecificDataLeveragePositionOpened {
    positionExpireBlock: string;
    sharesReceived: string;
}

export interface EventSpecificDataLeveragePositionLiquidated {
    liquidationFee: string;
}
