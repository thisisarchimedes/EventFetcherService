import nock from 'nock';
import {Mock} from './Mock';

export class MockSQS extends Mock {
  private sqsUrl: string;


  constructor(sqsUrl: string) {
    super();
    this.sqsUrl = sqsUrl;
  }

  public mockLogEndpoint() {
    nock('https://sqs.us-east-1.amazonaws.com')
        .persist() // Keep alive across multiple requests
        .get(/.*/) // Match any GET request path
        .reply(200, 'Mocked GET response') // Provide a mock response for GET requests
        .post(/.*/) // Match any POST request path
        .reply(200, 'Mocked POST response') // Provide a mock response for POST requests
        .put(/.*/) // Match any PUT request path
        .reply(200, 'Mocked PUT response') // Provide a mock response for PUT requests
        .delete(/.*/) // Match any DELETE request path
        .reply(200, 'Mocked DELETE response');

    nock.emitter.on('no match', (req) => {
      console.log('No match for request:', req);
    });

    /* nock('https://sqs.us-east-1.amazonaws.com')
        .persist()
        .post('/', () => true) // Match any POST request to the root path
        .reply(200, (_, requestBody) => {
          console.log('Intercepted request body: ', JSON.stringify(requestBody));
          return {}; // Provide an appropriate mock response
        });*/
  }
}
