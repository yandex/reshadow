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

const main = async () => {
    childProcess.execSync('rm -rf ./lib && mkdir lib');
    const pckg = require('./package.json');
    const {dependencies} = pckg;

    await readdir('../packages').then(dirs =>
        Promise.all(
            dirs.map(async dir => {
                await exec(`cp -R ../packages/${dir}/lib ./lib/${dir}`);
                Object.assign(
                    dependencies,
                    require(`../packages/${dir}/package.json`).dependencies,
                );
            }),
        ),
    );

    const nextPckg = {
        ...pckg,
        dependencies,
    };

    childProcess.execSync('cp ../README.md lib/README.md');
    childProcess.execSync('cp ../yarn.lock lib/yarn.lock');
    childProcess.execSync(
        `echo '${JSON.stringify(nextPckg, null, 2)}' > lib/package.json`,
    );
};

main();
