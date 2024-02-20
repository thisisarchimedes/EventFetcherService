export type IEventProcessorService = {
  execute(): Promise<void>;
};
