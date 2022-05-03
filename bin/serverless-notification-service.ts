#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessNotificationServiceStack } from '../lib/serverless-notification-service-stack';
import { Tags } from 'aws-cdk-lib';

const app = new cdk.App();
const myStack = new ServerlessNotificationServiceStack(
  app,
  `notifier-${process.env.DEPLOYMENT_ENV}`,
  {
    stackName: `notifier-${process.env.DEPLOYMENT_ENV}`,
    projectName: `notifier`,
    deploymentStage: `${process.env.DEPLOYMENT_ENV}`,
    description: `Serverless Notification stack to send SMS/EMAIL`,
    env: {
      region: `${process.env.DEPLOYMENT_REGION}`,
    },
  }
);

Tags.of(myStack).add('billingCode', `notifier`);
Tags.of(myStack).add('environment', `${process.env.DEPLOYMENT_ENV}`);
