#!/bin/sh

CUR=$(pwd)

CURRENT=$(cd $(dirname $0);pwd)
echo "${CURRENT}"

cd "${CURRENT}/app"
git pull --prune
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}"
  exit $result
fi
echo ""
pwd
corepack use pnpm@latest && pnpm up && rm -rf pnpm-lock.yaml && pnpm install && pnpm update && pnpm lint-fix && pnpm build
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}"
  exit $result
fi

cd "${CURRENT}/cdk"
git pull --prune
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}"
  exit $result
fi
echo ""
pwd
corepack use pnpm@latest && pnpm up && pnpm lint-fix && pnpm build
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}"
  exit $result
fi
git commit -am "Bumps node modules" && git push
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}"
  exit $result
fi

cd "${CUR}"
