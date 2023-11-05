require('newrelic');
import { EventProcessorService } from './EventScanner';

export const handler = async (event: any, context: any): Promise<void> => {
  const eventProcessorService = new EventProcessorService();
  await eventProcessorService.execute();
};
