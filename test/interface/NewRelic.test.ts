import {Logger} from '@thisisarchimedes/backend-sdk';

describe('New Relic Interface Test', function() {
  let logger: Logger;

  beforeEach(function() {
  });

  it('should send log to New Relic', async function() {
    Logger.initialize('Events fetcher: Interface Test');
    logger = Logger.getInstance();
    logger.error('This is a test log');
    await logger.flush();
  });
});


