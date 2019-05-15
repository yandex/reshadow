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

        for (let name in b[key]) {
            if (name.startsWith('@reshadow')) {
                delete b[key][name];
            }
        }

        a[key] = a[key] ? Object.assign(a[key], b[key]) : b[key];
    });

const main = async () => {
    childProcess.execSync('rm -rf ./lib && mkdir lib');
    const root = '../packages';

    const pckg = {...require('./package.json')};

    await exec(
        `BABEL_ENV=common npx babel --config-file ../babel.config.js ${root} --out-dir ./lib --ignore '${root}/**/spec','${root}/**/lib','${root}/**/*.spec.js','${root}/**/node_modules'`,
    );

    await exec(
        `npx babel --config-file ../babel.config.js index.js --out-dir ./lib`,
    );

    const dirs = await readdir(root);
    for (let dir of dirs) {
        merge(pckg, require(`${root}/${dir}/package.json`));
    }

    childProcess.execSync('cp ../README.md lib/README.md');
    childProcess.execSync('cp ../yarn.lock lib/yarn.lock');
    childProcess.execSync(
        `echo '${JSON.stringify(pckg, null, 2)}' > lib/package.json`,
    );
};

main();
