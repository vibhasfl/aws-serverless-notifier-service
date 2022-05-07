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

`cdk bootstrap --profile $awsprofile $aws_account_id/$aws_region`

## Creating cdk project

To satisfy all dependencies of this project including tools like typescript compiler and cdk toolkit from local project folder instead of global we would be using npx. [Ref](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

`npx aws-cdk init --language typescript`

## Setting default AWS profile with appropiate IAM permissions for deployment

`export AWS_DEFAULT_PROFILE="profilename"`

## Create cdk shortcut

`alias cdk="npx aws-cdk"`

## Passing environment variables for deployment

`DEPLOYMENT_REGION=ap-south-1 DEPLOYMENT_ENV=dev cdk deploy`
