#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
const name = app.node.tryGetContext('name') ?? 'next-ts-lambda-ssr-template';
new CdkStack(app, `${name}-stack`, {
    name,
});
