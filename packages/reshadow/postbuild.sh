#!/usr/bin/env bash

cp ../../README.md lib/README.md

for i in babel eslint macro postcss prettier webpack/loader
do
    FILE="lib/$i.js"
    mkdir -p "$(dirname "$FILE")" && echo "module.exports = require('@reshadow/$i');" > "$FILE"
done
