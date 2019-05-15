#!/usr/bin/env bash

rm -rf ./lib
npx rollup --config ../../rollup.config.js index.js --file lib/index.js --format cjs
npx copyfiles -e './**/spec/**' -e './**/*.spec.js' package.json README.md -a lib
cp ../../LICENSE ./lib/LICENSE
