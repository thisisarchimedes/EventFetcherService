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
