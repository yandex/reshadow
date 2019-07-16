const path = require('path');

const VirtualModulesPlugin = require('webpack-virtual-modules');

const utils = require('@reshadow/utils');

const virtualModules = new VirtualModulesPlugin();

const addDependency = (hash, code) => {
    const dirname = path.dirname(process.argv[1]);
    const filename = path.resolve(dirname, `/.cache/reshadow/${hash}.css`);

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
            // Regexp below should match on the CSS code from strings like that:
            //
            // __css__(`button {
            //   /* Some CSS rules here... */
            //   content: "*"; /* With some quotes maybe */
            // }`
            // /*__css_end__*/
            // , "2845693891")
            //
            // We're using trailing block comment /*__css_end__*/ to find the end of the code.
            /__css__\([`'"]((.|[\r\n])*?)[`'"][\r\n]\/\*__css_end__\*\/((.|[\r\n])*?)\)/g,
            (match, code) => {
                const hash = `${utils.getFileHash(filepath)}_${++index}`;
                const filename = addDependency(
                    hash,
                    code
                        .replace(/\\"/g, '"')
                        .replace(/\\'/g, "'")
                        .replace(/\\n/g, '\n'),
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
