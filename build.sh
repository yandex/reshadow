#!/usr/bin/env bash

rm -rf ./lib
npx babel --config-file ../../babel.config.js . --out-dir lib --ignore './**/spec/*','./**/*.spec.js','node_modules'
npx copyfiles -e './**/spec/**' -e './**/*.spec.js' package.json README.md -a lib
cp ../../LICENSE ./lib/LICENSE
