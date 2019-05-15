const path = require('path');

const VirtualModulesPlugin = require('webpack-virtual-modules');

const utils = require('@reshadow/utils');

const virtualModules = new VirtualModulesPlugin();

const addDependency = (hash, code) => {
    const filename = `/.cache/reshadow/${hash}.css`;

    virtualModules.writeModule(filename, code);

    return filename;
};

module.exports = function(source) {
    if (this.cacheable) this.cacheable();

    const {compiler} = this._compilation;

    /**
     * We need to tap 'after-environment' hook by hands,
     * because there is no 'official' register for the plugin
     */
    compiler.hooks.afterEnvironment.intercept({
        name: 'VirtualModulesPlugin',
        context: true,
        register: tap => (tap.fn(), tap),
    });

    virtualModules.apply(compiler);

    const filepath = this.resourcePath;

    let index = 0;

    const result = source
        .replace(
            /__css__\([`'"]((.|[\r\n])*?)[`'"]((.|[\r\n])*?)\)/g,
            (match, code) => {
                const hash = `${utils.getFileHash(filepath)}_${++index}`;
                const filename = addDependency(
                    hash,
                    code.replace(/\\n/g, '\n'),
                );

                return `require('${filename}')`;
            },
        )
        .replace(/\/\*__reshadow-styles__:"(.*?)"\*\//, (match, dep) => {
            const depPath = utils.resolveDependency({
                filename: dep,
                basedir: path.dirname(filepath),
            });

            this.dependency(depPath);

            return '';
        });

    return result;
};
