'use strict';

const fs = require('fs');
const util = require('util');
const childProcess = require('child_process');

const p = lib =>
    new Proxy(lib, {
        get: (target, prop) => util.promisify(target[prop]),
    });

const {readdir} = p(fs);
const {exec} = p(childProcess);

const depsList = ['dependencies', 'peerDependencies', 'optionalDependencies'];

const merge = (a, b) =>
    depsList.forEach(key => {
        if (!b[key]) return;
        if (!a[key]) {
            a[key] = b[key];
        } else {
            Object.assign(a[key], b[key]);
        }
    });

const main = async () => {
    childProcess.execSync('rm -rf ./lib && mkdir lib');

    const pckg = {...require('./package.json')};

    await readdir('../packages').then(dirs =>
        Promise.all(
            dirs.map(async dir => {
                // await exec(`cp -R ../packages/${dir}/lib ./lib/${dir}`);
                await exec(
                    `BABEL_ENV=common npx babel --config-file ../babel.config.js ../packages/${dir}/lib --out-dir ./lib/${dir} --ignore './**/spec/*','./**/*.spec.js','node_modules'`,
                );

                merge(pckg, require(`../packages/${dir}/package.json`));
            }),
        ),
    );

    for (let dep of depsList) {
        for (let key in pckg[dep]) {
            if (key.startsWith('@reshadow')) {
                delete pckg[dep][key];
            }
        }
    }

    childProcess.execSync('cp ../README.md lib/README.md');
    childProcess.execSync('cp ../yarn.lock lib/yarn.lock');
    childProcess.execSync(
        `echo '${JSON.stringify(pckg, null, 2)}' > lib/package.json`,
    );
};

main();
