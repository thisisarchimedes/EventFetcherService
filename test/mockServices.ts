// mockServices.ts
import { S3Service } from '../src/services/s3Service';
import { SQSService } from '../src/services/sqsService';

jest.mock('../src/services/s3Service');
jest.mock('../src/services/sqsService');

const mockS3Service = S3Service as jest.MockedClass<typeof S3Service>;
const mockSQSService = SQSService as jest.MockedClass<typeof SQSService>;

export { mockS3Service, mockSQSService };
