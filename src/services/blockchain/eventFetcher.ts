
export interface EventFetcher {

    getOnChainEvents(blockNumberFrom: number, blockNumberTo: number): Promise<any[]>;


}
