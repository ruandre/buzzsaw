#!/bin/sh
# Builds both libraries from the read-only /repo mount into /work/tarballs; container-only writes
set -eu

cp -a /repo/packages /work/packages
rm -rf /work/packages/*/dist
cp /repo/tsconfig.json /work/tsconfig.json
ln -sfn /repo/node_modules /work/node_modules
mkdir -p /work/tarballs

for package in core wav; do
  cd "/work/packages/$package"
  node /repo/node_modules/rolldown/bin/cli.mjs -c
  node /repo/node_modules/typescript/bin/tsc --emitDeclarationOnly
  npm pack --pack-destination /work/tarballs >/dev/null
  mv /work/tarballs/rjvr-buzzsaw*.tgz "/work/tarballs/$package.tgz"
done
