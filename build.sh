#!/usr/bin/env bash

rm -rf ./lib
npx copyfiles -e './**/spec/**' -e './**/*.spec.js' -e './lib' ./* -a lib
npx babel --config-file ../../babel.config.js . --out-dir lib --ignore './**/spec/*','./**/*.spec.js','./lib','node_modules'
cp ../../LICENSE ./lib/LICENSE
