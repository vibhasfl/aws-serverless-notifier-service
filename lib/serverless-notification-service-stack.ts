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
import * as iam from 'aws-cdk-lib/aws-iam';

export class ServerlessNotificationServiceStack extends Stack {
  public projectName: any;
  public deploymentStage: any;

  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props);

    this.projectName = props?.projectName;
    this.deploymentStage = props?.deploymentStage;

    const routerLambdaFn = this.createRouterLambdaFn();
    const txnlSqsQueue = this.createTxnlSqsQueue();
    const prmtlSqsQueue = this.createPrmtlSqsQueue();
    const txnlProcessorLambda = this.createTxnlProcessorLambdaFn();
    const prmtlProcessorLambda = this.createPrmtlProcessorLambdaFn();

    const gatewayLambdaFnPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['sqs:SendMessage'],
          resources: [txnlSqsQueue.queueArn, prmtlSqsQueue.queueArn],
        }),
      ],
    });

    routerLambdaFn.addEnvironment('txnlSqsQueue', txnlSqsQueue.queueUrl);
    routerLambdaFn.addEnvironment('prmtlSqsQueue', prmtlSqsQueue.queueUrl);
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

  createTxnlProcessorLambdaFn(): lambda.Function {
    let lambdaObj = new lambda.Function(this, 'txnlprocessor', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./resources/lambdas/transactional'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
    });

    return lambdaObj;
  }

  createPrmtlProcessorLambdaFn(): lambda.Function {
    let lambdaObj = new lambda.Function(this, 'prmtlprocessor', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./resources/lambdas/promotional'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
    });

    return lambdaObj;
  }
}
