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

## Creating cdk project

To satisfy all dependencies of this project including tools like typescript compiler and cdk toolkit from local project folder instead of global we would be using npx. [Ref](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

`npx aws-cdk init --language typescript`
