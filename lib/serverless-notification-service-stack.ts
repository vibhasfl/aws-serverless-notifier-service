interface CustomStackProps extends StackProps {
  projectName: String;
  deploymentStage: String;
}

import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib/core';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ServerlessNotificationServiceStack extends Stack {
  public readonly projectName: any;
  public readonly deploymentStage: any;

  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props);

    this.projectName = props?.projectName;
    this.deploymentStage = props?.deploymentStage;

    const routerLambdaFn = this.createRouterLambdaFn();
    const txnlSqsQueue = this.createTxnlSqsQueue();
    const prmtlSqsQueue = this.createPrmtlSqsQueue();
  }

  createRouterLambdaFn(): lambda.Function {
    const lambdaObj = new lambda.Function(this, `router`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./resources/lambdas/router'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
    });

    const fnUrl = lambdaObj.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [HttpMethod.POST],
        allowedOrigins: ['*'],
      },
    });

    new CfnOutput(this, 'RouterLbdFunctionURL', {
      value: fnUrl.url,
    });

    return lambdaObj;
  }

  createTxnlSqsQueue(): sqs.Queue {
    const txnlSqsQueue = new sqs.Queue(this, 'txnlqueue', {
      fifo: true,
      queueName: `${this.projectName}-txnl-${this.deploymentStage}.fifo`,
      retentionPeriod: cdk.Duration.minutes(5),
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    return txnlSqsQueue;
  }

  createPrmtlSqsQueue(): sqs.Queue {
    const txnlSqsQueue = new sqs.Queue(this, 'prmtlqueue', {
      queueName: `${this.projectName}-prmtl-${this.deploymentStage}`,
      retentionPeriod: cdk.Duration.days(1),
      visibilityTimeout: cdk.Duration.minutes(10),
    });

    return txnlSqsQueue;
  }
}
