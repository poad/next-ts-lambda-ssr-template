#!/usr/bin/env node
import { CdkStack } from '../lib/cdk-stack.js';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();
const name = app.node.tryGetContext('name') ?? 'next-ts-lambda-ssr-template';
new CdkStack(app, `${name}-stack`, {
  name,
});
