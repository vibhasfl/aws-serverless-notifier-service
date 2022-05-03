import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib/core';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class ServerlessNotificationServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const routerLambdaFn = this.createRouterLambdaFn();
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
}
