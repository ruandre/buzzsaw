#!/bin/sh
# Typechecks + runs the packed tarballs as a Node ESM consumer does: nodenext, no lib.dom, no @types/node, no skipLibCheck
set -eu

sh /repo/scripts/container/pack-libs.sh

mkdir -p /work/consumer
cp -a /repo/test/consumer/. /work/consumer
rm -f /work/consumer/compose.yaml
cd /work/consumer
npm install --no-save --no-audit --no-fund --no-package-lock --ignore-scripts \
    /work/tarballs/core.tgz /work/tarballs/wav.tgz

node /repo/node_modules/typescript/bin/tsc -p tsconfig.json
node --experimental-strip-types src/consumer.ts
echo 'consumer check passed'
