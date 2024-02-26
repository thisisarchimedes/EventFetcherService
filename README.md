# Leverage events fetcher


## Overview

This repository contains the backend microservices infrastructure designed to fetch events from the Leverage Engine smart contract. For a detailed explanation of the architecture, please refer to [Architecture design](https://www.notion.so/archimedesfi/Architectural-Proposal-for-Event-Processing-Micro-Service-327458f8dfec462c87758fbd509ef314)

## Run Locally

0. Make sure Node.js and Yarn are installed
1. Install requirements: `yarn install`
2. Export the following environment variables
   ```bash
   PAT_TOKEN - GitHub token required by the Backend SDK
   
   ENVIRONMENT=Demo # Test/Production (need to match AWS AppConfig application name)
   ## Environment is CASE SENSITIVE - e.g.: "Demo" is not the same as "demo" ##
   ```
   If you run tests you also need
   ```bash
   NEW_RELIC_API_KEY
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION=us-east-1

   PSP_ACCEPTANCE_TEST_NODE= # The RPC URL of the node we test agains
   S3_BUCKET_CONFIG=smart-contract-backend-config
   PSP_STRATEGY_CONFIG_FILE=strategies-production.json # the PSP strategy configuration file locally

   ALCHEMY_API_KEY= # Only the key (no need for the entire URL)
   INFURA_API_KEY= # Only the key (no need for the entire URL)
   ```
3. Run tests
   ```bash
   yarn test # runs unit and acceptance tests + convrage report
   yarn test:acceptance # acceptance test only
   yarn test:all # unit + acceptance+interface tests
   ```

### Linter
```bash
yarn lint
```

## Continuous Deployment

`template.yaml` is the AWS SAM script deploying the project to different environments:
1. On commit: Github runs Commit Stage (`commit.yml`) - Unit tests, Linter and tsc
2. On PR open: Github runs Acceptance Stage (`acceptance.yml`) - Acceptance tests
3. On PR merge: Githu runs Deploy Stage (`deploy.yml`) - Deploying project to different environments (including Production)
4. Every day at 00:00 UTC we run nightly test (`nightly.yml`) - Running Unit and Acceptance tests + some more extensive coverage (Stryker)

### Demo/Test/Production Runner 

The code is run by AWS Lambda. Enrty point: `lambda-handler.ts`
