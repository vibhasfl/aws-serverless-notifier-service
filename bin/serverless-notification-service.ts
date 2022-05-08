#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessNotificationServiceStack } from '../lib/serverless-notification-service-stack';
import { Tags } from 'aws-cdk-lib';

const app = new cdk.App();
const projectName =
  process.env.PROJECT_NAME || app.node.tryGetContext('projectName');

const stage = process.env.DEPLOYMENT_ENV || app.node.tryGetContext('stage');

const region =
  process.env.DEPLOYMENT_REGION || app.node.tryGetContext('region');

if (!projectName) {
  console.error('Project name is not defined');
}

if (!stage) {
  console.error('Deployment stage not defined');
}

if (!region) {
  console.error('Deployment region not defined');
}

const myStack = new ServerlessNotificationServiceStack(
  app,
  `${projectName}-${stage}`,
  {
    stackName: `${projectName}-${stage}`,
    description: `Serverless Notification stack to send SMS/EMAIL`,
    env: {
      region: `${region}`,
    },
  }
);

Tags.of(myStack).add('billingCode', `${projectName}`);
Tags.of(myStack).add('environment', `${stage}`);
