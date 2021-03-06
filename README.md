# Serverless Notification service

This AWS Cloudformation stack can serve as your notifier stack to send SMS and EMAIL. Since its serverless it can scale out/in when needed without any manual configuration.

![AWS Serverless Notification service architecure diagram](sls-notifer.png)

# Features

- [Serverless](https://aws.amazon.com/serverless/) so nothing to manage, its scalable, more flexible and quick to release with pay as you go model.
- Auto retrial in case of failures
- Can handle email of any size . This depends on your mail server limit. Eg: AWS SES allows 10MB max.
- Transactional type can be used for quick delivery of messages within seconds
- Promotional type can be used for sending promotional or delayed communication
- One can add its own implementation or vendor lib to send SMS/EMAIL
- Using [aws cdk](https://docs.aws.amazon.com/cdk/v2/guide/home.html) for defining cloud infrastructure as code a.k.a [IAC](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html) so your infra too is version controlled as part of your application repository along with other [benefits](https://techcommunity.microsoft.com/t5/fasttrack-for-azure/the-benefits-of-infrastructure-as-code/ba-p/2069350).
- Each request is logged into CW for future analysis and debugging

# Getting Started

Install cdk

`npm install -g aws-cdk-lib`

Deploy CDK toolkit stack in your aws environment [Ref](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

`cdk bootstrap --qualifier $randomString --profile $awsprofile $aws_account_id/$aws_region`

## Creating cdk project

To satisfy all dependencies of this project including tools like typescript compiler and cdk toolkit from local project folder instead of global we would be using npx. [Ref](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

`npx aws-cdk init --language typescript`

## Setting default AWS profile with appropiate IAM permissions for deployment

`export AWS_DEFAULT_PROFILE="profilename"`

## Create cdk shortcut

`alias cdk="npx aws-cdk"`

## Passing environment variables for deployment

You can set your environment variable in [cdk.context.json](https://docs.aws.amazon.com/cdk/v2/guide/context.html#context_construct) OR pass directly from command line

`PROJECT_NAME=notifier DEPLOYMENT_REGION=ap-south-1 DEPLOYMENT_ENV=dev cdk deploy`

## Security

For demo purpose current AuthType for Router lambda function URL is set to NONE but in production you should set it to AWS_IAM and make sure caller has `lambda:InvokeFunctionUrl` permission. [Ref](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)

# Rest Endpoints and payload

| Method |  Function URL | Payload                                                                                                                                                                                                             |
| -----: | ------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   POST |   {fnURL}/sms | { "message":"Your message", "mobileNos":["xxxxxxx"], "type":"PROMOTIONAL" }                                                                                                                                         |
|   POST | {fnURL}/email | { "htmlMailBody":"Welcome to email testing", "subject":"Test Subject", "type":"TRANSACTIONAL", "toEmailIds":["xxxxx"], "ccEmailIds":["xxxx"], "attachments":[ "content":"'base64content", "fileName":"image.jpg" ]} |

- Refer RouterLbdFunctionURL in Cfn output section for fnURL
- By changing application code in resources folder you can customize your payload if needed
- Make sure caller has appropiate IAM permission to call api endpoint. [Ref](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)

# Customization

- Function defination to send SMS/EMAIL is commented so that one can write their own implementation.
- Check index.js files in resources/promotional and resources/transactional folders

# Message retrial configuration

- Message can be of two types TRANSACTIONAL or PROMOTIONAL
- TRANSACTIONAL

  - Messages of this type are delivered within seconds
  - They are retried every 15 sec until retention period (3 min) expires or message is being deleted
  - They are poped as soon as they are avaliable in queue

- PROMOTIONAL

  - Messages of this type are delivered in few minutes
  - They are retried every 5 min until retention period expired or message is being deleted
  - They are processed in batches of 10 and batchWindow of 1min

- Message are auto delete from queue if lambda return success

# Future enhancements

- This stack is using AWS [Lambda function URL](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html) to generate REST API endpoint but if you need advance features like realtime limit tracking,advance throttling,caching,websockets etc we can use [API Gateway](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html) instead.
- Env driven retrial configuration
- Upload to S3 when msg size is greater than 256KB

# Testing Lambdas

- In order to test lambda locally make sure you have docker and [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) cli installed
- Ref: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html

# Useful cdk commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
