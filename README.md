# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

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
`DEPLOYMENT_REGION=ap-south-1 DEPLOYMENT_ENV=dev cdk deploy`

# Rest Endpoints and payload

Refer RouterLbdFunctionURL in Cfn output section . By changing application code in resources folder you can customize your payload if needed

| Method |      Function URL | Payload                                                                                                                                                                                                             |
| -----: | ----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   POST |   {yourfnURL}/sms | { "message":"Your message", "mobileNos":["xxxxxxx"], "type":"PROMOTIONAL" }                                                                                                                                         |
|   POST | {yourfnURL}/email | { "htmlMailBody":"Welcome to email testing", "subject":"Test Subject", "type":"TRANSACTIONAL", "toEmailIds":["xxxxx"], "ccEmailIds":["xxxx"], "attachments":[ "content":"'base64content", "fileName":"image.jpg" ]} |

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

# Testing Lambdas
