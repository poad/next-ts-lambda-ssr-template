import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
// import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
// import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as logs from 'aws-cdk-lib/aws-logs';

interface CdkStackProps extends cdk.StackProps {
  name: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const { name } = props;

    const functionName = `${name}-function`;
    new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });

    // Next.js standaloneを動かすLambdaの定義
    const handler = new lambda.DockerImageFunction(this, 'Handler', {
      functionName,
      code: lambda.DockerImageCode.fromImageAsset('../app', {
        platform: assets.Platform.LINUX_AMD64,
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
    });

    const url = handler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // // Amazon API Gateway HTTP APIの定義
    // new apigatewayv2.HttpApi(this, 'Api', {
    //   apiName: `${name}-api`,
    //   defaultIntegration: new integrations.HttpLambdaIntegration(
    //     'Integration',
    //     handler,
    //   ),
    // });
    new cdk.CfnOutput(this, 'Output', {
      value: url.url,
    });
  }
}
