// Import the AWS SDK and configure the region
import { ConfigService } from './services/config/ConfigService';
import { Logger } from '@thisisarchimedes/backend-sdk';
import { KMSFetcherService } from './services/kms/KMSFetcherService';
import { KMS } from 'aws-sdk';

export default class MonitorTrackerService {
  private kms: KMSFetcherService = new KMSFetcherService();
  constructor(private logger: Logger, private configService: ConfigService) {}

  public async updateEthBalances() {
    // Replace 'your-key-id' with your actual KMS key ID or ARN
    getKmsKeyTags('your-key-id')
      .then(tags => {
        // Process tags or additional logic here
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  public async getEthBalances() {}

  private async getMonitorAddress() {
    (await Promise.all([
      this.kms.fetchTags(this.configService.getPSPKeyARN()),
      this.kms.fetchTags(this.configService.getLeverageKeyARN()),
      this.kms.fetchTags(this.configService.getUrgentKeyARN()),
    ])).map((tags: KMS.TagList) => {
        const address = tags.find(tag => tag.TagKey === 'Address')?.Value);
    }
    });
  }
}

// 1.Get monitor Address
// 2. Call alchemy/infura and get the address' eth balance
// 3. Update the balance in the db
