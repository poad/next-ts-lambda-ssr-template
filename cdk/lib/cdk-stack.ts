import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface CdkStackProps extends cdk.StackProps {
  readonly name: string;
}

// app/.web-package 配下 (事前に `pnpm --filter app build:web` で生成)
const webPackageDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'app',
  '.web-package',
);

function readPackageHash(): string {
  const hashFile = path.join(webPackageDir, '.package-hash');
  if (!fs.existsSync(hashFile)) {
    throw new Error(
      `Web Function のコード (${webPackageDir}) がありません。先に \`pnpm --filter app build:web\` を実行してください。`,
    );
  }
  return fs.readFileSync(hashFile, 'utf8').trim();
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const { name } = props;

    const functionName = `${name}-web`;
    const packageHash = readPackageHash();

    // Web Function の実行ロール (CloudWatch Logs 書き込み権限)
    const executionRole = new iam.Role(this, 'WebExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // デプロイパッケージ配置バケット (Web Functions は versioning 必須)
    const codeBucket = new s3.Bucket(this, 'WebCodeBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    codeBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowLambdaWebFunctionCodeAccess',
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['s3:GetObject', 's3:GetObjectVersion'],
        resources: [codeBucket.arnForObjects('*')],
        conditions: {
          ArnLike: {
            'aws:SourceArn': `arn:${cdk.Stack.of(this).partition}:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:web-function/${functionName}/revision/*`,
          },
        },
      }),
    );

    // .web-package/ を zip のまま配置 (extract しない)
    const deployment = new s3deploy.BucketDeployment(this, 'WebCodeDeployment', {
      sources: [s3deploy.Source.asset(webPackageDir)],
      destinationBucket: codeBucket,
      destinationKeyPrefix: 'web-function',
      extract: false,
      prune: false,
    });

    // Web Functions のログは /aws/lambda/web/<name> に集約される
    new logs.LogGroup(this, 'WebLogGroup', {
      logGroupName: `/aws/lambda/web/${functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });

    // Lambda Web Functions は CDK L1 未提供のため CfnResource で定義
    // (L1 の CfnWebFunction 等が提供され次第の置換可)
    const webFunction = new cdk.CfnResource(this, 'WebFunction', {
      type: 'AWS::Lambda::WebFunction',
      properties: {
        FunctionName: functionName,
      },
    });

    const revision = new cdk.CfnResource(this, 'WebRevision', {
      type: 'AWS::Lambda::WebFunctionRevision',
      properties: {
        FunctionName: webFunction.ref,
        // コード変更で置換されるようコンテンツハッシュを持たせる
        Description: `code:${packageHash}`,
        BuildConfig: {
          CodeConfig: {
            S3Object: {
              Bucket: codeBucket.bucketName,
              Key: cdk.Fn.select(0, deployment.objectKeys),
            },
          },
          RuntimeConfig: {
            // Web Functions は Node.js のみ、Arm64 固定
            Runtime: 'nodejs24.x',
          },
        },
        ServiceConfig: {
          ExecutionRoleArn: executionRole.roleArn,
          TimeoutSeconds: 30,
        },
      },
    });
    // 最新オブジェクト配置後に Revision を作成させる
    revision.node.addDependency(deployment);

    const endpoint = new cdk.CfnResource(this, 'WebEndpoint', {
      type: 'AWS::Lambda::WebFunctionEndpoint',
      properties: {
        FunctionName: webFunction.ref,
        EndpointName: 'default',
        EndpointType: 'HomeRegion',
        // 旧構成の FunctionUrlAuthType.NONE 相当 (アプリ側で認証)
        AuthType: 'ApplicationManaged',
        RevisionWeights: [
          {
            RevisionId: revision.getAtt('RevisionId').toString(),
            Weight: 100,
          },
        ],
      },
    });

    new cdk.CfnOutput(this, 'Output', {
      value: `https://${endpoint.getAtt('DomainName').toString()}`,
    });
  }
}
