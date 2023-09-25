# Multi-stage buildでNext.jsをビルド
FROM node:lts-bullseye AS builder
RUN npm install -g bun
WORKDIR /build
COPY package*.json ./
RUN bun i
COPY . ./
RUN bun run build

# ベースイメージの変更
FROM amazon/aws-lambda-nodejs:18

# Lambda Web Adapterのインストール
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.7.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=3000

COPY --from=builder /build/next.config.js ./
COPY --from=builder /build/public ./public
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/.next/standalone ./

# ベースイメージ変更に伴う調整
ENTRYPOINT ["node"]
CMD ["server.js"]