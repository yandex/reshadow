#!/usr/bin/env bash

cp ../../README.md lib/README.md

for i in babel eslint macro postcss prettier
do
   echo "module.exports = require('@reshadow/$i');" > "lib/$i.js"
done
