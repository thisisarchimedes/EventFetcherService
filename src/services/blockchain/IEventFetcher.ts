import {ethers} from 'ethers';

export interface IEventFetcher {

    getOnChainEvents(blockNumberFrom: number, blockNumberTo: number, topics: string[]): Promise<ethers.providers.Log[]>;


}
