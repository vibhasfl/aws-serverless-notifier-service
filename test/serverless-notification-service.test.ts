import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ServerlessNotificationService from '../lib/serverless-notification-service-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/serverless-notification-service-stack.ts
test('Router Lambda function is created', () => {
  const app = new cdk.App();

  // WHEN
  const stack =
    new ServerlessNotificationService.ServerlessNotificationServiceStack(
      app,
      'MyTestStack'
    );
  // THEN
  const template = Template.fromStack(stack);
  //   template.hasResource('AWS::Lambda::Function');
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs14.x',
  });
});
