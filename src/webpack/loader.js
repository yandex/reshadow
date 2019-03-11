const utils = require('../common/utils');
const VirtualModulesPlugin = require('webpack-virtual-modules');

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
        register: tap => tap.fn(),
    });

    virtualModules.apply(compiler);

    let index = 0;

    const result = source.replace(
        /__css__\([`'"]((.|[\r\n])*?)[`'"]((.|[\r\n])*?)\)/g,
        (match, code) => {
            const hash = `${utils.getFileHash(this.resource)}_${++index}`;
            const filename = addDependency(hash, code.replace(/\\n/g, '\n'));

            return `require('${filename}')`;
        },
    );

    return result;
};
