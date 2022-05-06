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
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';

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

    const emailerS3Bucket = this.createEmailerS3Bucket();

    // Set Router Lambda Permissions
    const gatewayLambdaFnPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['sqs:SendMessage'],
          resources: [txnlSqsQueue.queueArn, prmtlSqsQueue.queueArn],
        }),
        new iam.PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [
            emailerS3Bucket.bucketArn,
            `${emailerS3Bucket.bucketArn}/*`,
          ],
        }),
      ],
    });

    routerLambdaFn.role?.attachInlinePolicy(
      new iam.Policy(this, 'sqs_s3', {
        document: gatewayLambdaFnPolicyDocument,
        policyName: 'sqs_push_s3_upload',
      })
    );
    routerLambdaFn.addEnvironment('txnlSqsQueue', txnlSqsQueue.queueUrl);
    routerLambdaFn.addEnvironment('prmtlSqsQueue', prmtlSqsQueue.queueUrl);

    // Set Processor Lambda Permission
    const processorLambdaFnPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:GetObject', 's3:DeleteObject'],
          resources: [
            emailerS3Bucket.bucketArn,
            `${emailerS3Bucket.bucketArn}/*`,
          ],
        }),
      ],
    });

    const processorS3Policy = new iam.Policy(this, 's3_get_delete', {
      document: processorLambdaFnPolicyDocument,
    });

    txnlProcessorLambda.role?.attachInlinePolicy(processorS3Policy);

    prmtlProcessorLambda.role?.attachInlinePolicy(processorS3Policy);

    txnlProcessorLambda.addEventSource(
      new eventsources.SqsEventSource(txnlSqsQueue, { batchSize: 1 })
    );

    prmtlProcessorLambda.addEventSource(
      new eventsources.SqsEventSource(prmtlSqsQueue, { batchSize: 10 })
    );
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

  createEmailerS3Bucket(): s3.Bucket {
    let s3Bucket = new s3.Bucket(this, 'emailers3', {
      bucketName: `${this.projectName}-emailer-${this.deploymentStage}`,
    });

    return s3Bucket;
  }
}
