import { ethers } from 'ethers'
import { IEventScanner } from './IEventScanner' // Import the interface
import { S3Service } from '../common/s3Service'
import { SQSService } from '../common/sqsService'

export class EventScanner implements IEventScanner {
  private sqsService: SQSService
  private web3Provider: ethers.JsonRpcProvider
  private contract: ethers.Contract
  private S3Service: S3Service
  private topics: string[]
  private eventsQueueURL: string
  private bucketName: string

  constructor() {
    // Initialize AWS SDK for S3 and SQS
    this.S3Service = new S3Service()
    this.sqsService = new SQSService()

    this.web3Provider = new ethers.JsonRpcProvider()
    this.S3Service = new S3Service()

    // Initialize contract
    const abi = [] // Your ABI here
    const leverageEngineAddress = process.env.LEVERAGE_ENGINE_ADDRESS!
    this.eventsQueueURL = process.env.NEW_EVENTS_QUEUE_URL!
    this.bucketName = process.env.BUCKET_NAME!

    this.topics = process.env.TOPICS!.split(',')
    this.contract = new ethers.Contract(
      leverageEngineAddress,
      abi,
      this.web3Provider,
    )
  }

  private async checkAndSetActiveProvider(): Promise<void> {
    try {
      this.web3Provider = new ethers.JsonRpcProvider(
        'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',
      )
      await this.web3Provider.getBlockNumber()
    } catch (e) {
      try {
        this.web3Provider = new ethers.JsonRpcProvider(
          'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        )
        await this.web3Provider.getBlockNumber()
      } catch (err) {
        throw new Error('Both Alchemy and Infura are down')
      }
    }
  }

  async getLastScannedBlock(): Promise<number> {
    try {
      const data = await this.S3Service.getObject(
        this.bucketName,
        'last-block.txt',
      )
      return parseInt(data)
    } catch (e) {
      return (await this.web3Provider.getBlockNumber()) - 1000 // Default to 1000 blocks ago
    }
  }

  async setLastScannedBlock(blockNumber: number): Promise<void> {
    await this.S3Service.putObject(
      this.bucketName,
      'last-block.txt',
      blockNumber.toString(),
    )
  }

  async scanEvents(): Promise<void> {
    await this.checkAndSetActiveProvider()
    const lastBlock = await this.getLastScannedBlock()
    const latestBlock = await this.web3Provider.getBlockNumber()

    const logs = await this.web3Provider.getLogs({
      fromBlock: lastBlock,
      toBlock: latestBlock,
      address: this.contract.address,
      topics: this.topics,
    })

    for (const log of logs) {
      const parsed = this.contract.interface.parseLog(log)
      const event = {
        ...parsed,
        log,
      }
      await this.sqsService.sendMessage(
        this.eventsQueueURL,
        JSON.stringify(event),
      )
    }

    await this.setLastScannedBlock(latestBlock)
  }
}
