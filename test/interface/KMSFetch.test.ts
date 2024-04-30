import {expect} from 'chai';
import {KMSFetcherService} from '../../src/services/kms/KMSFetcherService';

import dotenv from 'dotenv';

dotenv.config();

describe('Fetch Variables from KMS', function() {
  it('should fetch tags from kms', async function() {
    const arn =
      'arn:aws:kms:us-east-1:240910251918:key/6e9550de-8e46-4608-a8bf-063293d3ea0a';
    const kmsFetcherService = new KMSFetcherService();
    const tags = await kmsFetcherService.fetchTags(arn);

    expect(tags).to.be.an('array');
    expect(tags!.length).to.be.gte(1);
    expect(tags![0]).to.have.property('TagKey');
    expect(tags![0]).to.have.property('TagValue');
  });
});
