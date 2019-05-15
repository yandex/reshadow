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

const merge = (a, b) =>
    ['dependencies', 'peerDependencies', 'optionalDependencies'].forEach(
        key => {
            if (!b[key]) return;
            if (!a[key]) {
                a[key] = b[key];
            } else {
                Object.assign(a[key], b[key]);
            }
        },
    );

const main = async () => {
    childProcess.execSync('rm -rf ./lib && mkdir lib');

    const pckg = {...require('./package.json')};

    await readdir('../packages').then(dirs =>
        Promise.all(
            dirs.map(async dir => {
                await exec(`cp -R ../packages/${dir}/lib ./lib/${dir}`);

                merge(pckg, require(`../packages/${dir}/package.json`));
            }),
        ),
    );

    childProcess.execSync('cp ../README.md lib/README.md');
    childProcess.execSync('cp ../yarn.lock lib/yarn.lock');
    childProcess.execSync(
        `echo '${JSON.stringify(pckg, null, 2)}' > lib/package.json`,
    );
};

main();
