# next-ts-lambda-ssr-template

Next.js App Router を AWS Lambda Web Functions で SSR ホスティングするテンプレート。

Lambda (Event Functions) + Lambda Web Adapter のコンテナ構成から移行済み。Adapter・Docker 不要で、Next.js standalone サーバーがそのまま動作する。

## 構成

- `app/`: Next.js (standalone 出力) + Web Functions 用パッケージング (`build:web`)
- `cdk/`: `AWS::Lambda::WebFunction` / `WebFunctionRevision` / `WebFunctionEndpoint` を CDK で定義 (L1 未提供のため `CfnResource`)

ランタイムは `nodejs24.x` (Arm64 固定)、メモリ 2GB 固定、エンドポイントは公開 (`ApplicationManaged`、旧構成の Function URL `NONE` 相当)。

## デプロイ

Web Functions 提供リージョンで実行すること (2026-10 時点: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`, `eu-west-1`)。

```sh
pnpm install -r
pnpm --filter app build:web
pnpm --filter cdk exec cdk deploy --context name=<name>
```

出力された `https://...` がエンドポイント URL。

## 仕組み

- `app/scripts/package-web.mjs` が `.next/standalone` + `public` + `.next/static` を `app/.web-package/` に組み立て、`AWS_LAMBDA_HTTP_ENDPOINT` を `PORT`/`HOSTNAME` に変換する `index.js` エントリーを生成する
- CDK は `.web-package/` をバージョニング有効の S3 バケットに配置 (Lambda への読み取り許可付き) し、Revision / Endpoint を作成する
- コード変更時は `.package-hash` が Revision の `Description` に入るため、差分があれば自動で Revision が置換され、Endpoint (Weight 100) が新 Revision を向く

ローカル確認: `AWS_LAMBDA_HTTP_ENDPOINT=127.0.0.1:3000 node app/.web-package/index.js`
