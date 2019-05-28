#!/usr/bin/env bash

cp ../../README.md lib/README.md

filelist=(
    babel
    eslint
    macro
    postcss
    prettier
    react
    react/styled
    svelte
    svelte/preprocess
    vue
    webpack/loader
)

for i in "${filelist[@]}"
do
    FILE="lib/$i.js"
    mkdir -p "$(dirname "$FILE")" && echo "module.exports = require('@reshadow/$i');" > "$FILE"
done
