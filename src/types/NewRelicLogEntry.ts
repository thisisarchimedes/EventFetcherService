export interface EventFetcherLogEntryMessage {
    event: string;
    user: string;
    strategy: string;
    amount: string;
}

export interface NewRelicLogEntry {
    environment: string;
    message: EventFetcherLogEntryMessage;
    level: string;
    timestamp: number;
    service: string;
}
