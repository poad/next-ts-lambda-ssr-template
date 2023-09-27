import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

interface CdkStackProps extends cdk.StackProps {
  name: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const { name } = props;

    // Next.js standaloneを動かすLambdaの定義
    const handler = new lambda.DockerImageFunction(this, 'Handler', {
      functionName: `${name}-function`,
      code: lambda.DockerImageCode.fromImageAsset('../app', {
        platform: assets.Platform.LINUX_AMD64,
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
    });
    // Amazon API Gateway HTTP APIの定義
    new apigatewayv2.HttpApi(this, 'Api', {
      apiName: `${name}-api`,
      defaultIntegration: new integrations.HttpLambdaIntegration(
        'Integration',
        handler,
      ),
    });
  }
}
