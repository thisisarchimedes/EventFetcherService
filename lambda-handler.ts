import { EventProcessorService } from './src/EventScanner' // Adjust the import to your file structure

export const handler = async (event: any, context: any): Promise<void> => {
  const eventProcessorService = new EventProcessorService()
  await eventProcessorService.execute()
}
