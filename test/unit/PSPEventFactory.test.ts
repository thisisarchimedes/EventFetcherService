import { S3Service, SQSService, Logger } from '@thisisarchimedes/backend-sdk';

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

import { EventProcessorService } from '../../src/EventProcessorService';
import { LoggerPort } from '../ports/LoggerPort';
import { EventFetcherPort } from '../ports/EventFetcherPort';
import { ConfigServicePSPPort } from '../ports/ConfigServicePSPPort';
import { config } from 'dotenv';

import { EventFactory } from '../../src/onchain_events/EventFactory';
import { OnChainEvent } from '../../src/onchain_events/OnChainEvent';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';


describe('PSP Events Logging', function() {
  it('should report on Deposit event', async function() {
    const logger = new LoggerPort('local_logger.txt');
    const eventFetcher = new EventFetcherPort();
    eventFetcher.setEventArrayFromFile('test/data/depositEvent.json');

    const configService = new ConfigServicePSPPort('test/data/strategies.json');
    await configService.refreshStrategyConfig();

    const eventFactory = new EventFactory(configService, logger as unknown as Logger);

    const eventsLog = await eventFetcher.getOnChainEvents(100, 200);

    const onChainEvents: OnChainEvent[] = [];

    for (const event of eventsLog) {
      try {
        const evt = eventFactory.createEvent(event);
        onChainEvents.push(evt);
      } catch (e) {
        if (e.message === 'Unknown strategy address') {
          continue;
        }
      }
    }

    expect(onChainEvents.length).to.equal(1);

    onChainEvents[0].process();

    const expectedLogMessage = {
      event: 'Deposit',
      user: '0x93B435e55881Ea20cBBAaE00eaEdAf7Ce366BeF2',
      strategy: 'Convex FRAXBP/msUSD Single Pool',
      amount: '5000000',
    };


    const logMessage = JSON.parse(logger.getLastMessage().split('INFO: ')[1]);

    expect(logMessage.event).to.equal(expectedLogMessage.event);
    expect(logMessage.user).to.equal(expectedLogMessage.user);
    expect(logMessage.strategy).to.equal(expectedLogMessage.strategy);
    expect(logMessage.amount).to.equal(expectedLogMessage.amount);
  });
});

