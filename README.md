# Leverage events fetcher

## Table of Contents

1. [Overview](#overview)
2. [Run Locally](#run-locally)
   - [Install dependencies](#install-dependencies)
   - [Get .env file](#get-env-file)
   - [Update .env](#update-env)
   - [Run tests](#run-tests)
3. [Linter](#linter)
4. [Environment Variables](#environment-variables)
   - [For running](#environment-variables-if-we-dont-run-tests)
   - [For testing](#additional-environment-variables-for-testing)
5. [Continuous Deployment](#continuous-deployment)
6. [Troubleshooting](#troubleshooting)
   - [dotenvx doesn't work properly](#dotenvx-doesnt-work-properly)

## Overview

This repository contains the backend microservices infrastructure designed to fetch events from the Leverage Engine smart contract. For a detailed explanation of the architecture, please refer to [Architecture design](https://www.notion.so/archimedesfi/Architectural-Proposal-for-Event-Processing-Micro-Service-327458f8dfec462c87758fbd509ef314)

## Run Locally

_*Install dependencies*_
1. Make sure Node.js and Yarn are installed
2. Install requirements: `yarn install`

_*Get .env file*_
```bash
yarn dotenvx hub # open and follow the link printed, copy the keys to .env.keys locally
set -o allexport && source .env.keys && set +o allexport # export .env.keys to local environment
yarn dotenvx decrypt # decrypt .env.vault to .env
set -o allexport && source .env && set +o allexport # export .env to local environment
```

_*Update .env*_
```bash
yarn dotenvx encrypt
yarn dotenvx hub push # push the keys to the dotenvx hub
```
Next: 
- commit `.env.vault` to github _**DO NOT COMMIT .evn.keys or .env to github**_
- Update the repo Github Secrets `DOTENV_KEY`

_*Run tests*_
   ```bash
   yarn test # runs unit and acceptance tests + convrage report
   yarn test:acceptance # acceptance test only
   yarn test:all # unit + acceptance+interface tests
   ```

### Linter
```bash
yarn lint
```

### Environment Variables

Environment variables (if we don't run tests)
```bash
   PAT_TOKEN - GitHub token required by the Backend SDK
   NEW_RELIC_API_KEY - required by the Backend SDK

   ENVIRONMENT=Demo # Test/Production (need to match AWS AppConfig application name)
   ## Environment is CASE SENSITIVE - e.g.: "Demo" is not the same as "demo" ##
   ```

Additional environment variables for testing
   ```bash
   NEW_RELIC_API_KEY
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION=us-east-1

   PSP_ACCEPTANCE_TEST_NODE= # The RPC URL of the node we test against
   S3_BUCKET_CONFIG=smart-contract-backend-config
   PSP_STRATEGY_CONFIG_FILE=strategies-production.json # the PSP strategy configuration file locally

   ALCHEMY_API_KEY= # Only the key (no need for the entire URL)
   INFURA_API_KEY= # Only the key (no need for the entire URL)
   ```

## Continuous Deployment

`template.yaml` is the AWS SAM script deploying the project to different environments:
1. On commit: Github runs Commit Stage (`commit.yml`) - Unit tests, Linter and tsc
2. On PR open: Github runs Acceptance Stage (`acceptance.yml`) - Acceptance tests
3. On PR merge: Githu runs Deploy Stage (`deploy.yml`) - Deploying project to different environments (including Production)

The code is run by AWS Lambda. Enrty point: `lambda-handler.ts`

## Troubleshoting

### dotenvx doesn't work properly
Check the following linkes
- Github Action: https://dotenvx.com/docs/cis/github-actions#initial-setup
- Local: https://dotenvx.com/docs/install#npm
5. Every day at 00:00 UTC we run nightly test (`nightly.yml`) - Running Unit and Acceptance tests + some more extensive coverage (Stryker)
