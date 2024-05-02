
import {Logger} from './Logger';
import {LoggerNewRelic} from './LoggerNewRelic';
import {ConfigServiceAWS} from '../config/ConfigServiceAWS';
import {LoggerConsole} from './LoggerConsole';


export class LoggerAll extends Logger implements LoggerAll {
  private loggerConsole: LoggerConsole;
  private loggerNewRelic: LoggerNewRelic;

  constructor(
      configService: ConfigServiceAWS,
  ) {
    super();
    this.loggerConsole = new LoggerConsole();
    this.loggerNewRelic = new LoggerNewRelic(configService, 'EventFetcherService');
  }

  public async flush(): Promise<void> {
    await Promise.all([
      this.loggerConsole.flush(),
      this.loggerNewRelic.flush(),
    ]);
  }

  public debug(message: string): void {
    this.loggerConsole.debug(message);
    this.loggerNewRelic.debug(message);
  }

  public info(message: string): void {
    this.loggerConsole.info(message);
    this.loggerNewRelic.info(message);
  }

  public warn(message: string): void {
    this.loggerConsole.warn(message);
    this.loggerNewRelic.warn(message);
  }

  public error(message: string): void {
    this.loggerConsole.error(message);
    this.loggerNewRelic.error(message);
  }
}
