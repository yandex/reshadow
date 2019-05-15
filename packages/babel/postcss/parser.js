/**
 * Sync version of css-modules-loader-core parser
 * @see https://github.com/jsdf/css-modules-loader-core-sync/blob/e3325216257535351cf0439039ec32cbca4829b5/src/SyncParser.js
 */

const resolve = require('resolve');
const path = require('path');

const AsyncParser = require('css-modules-loader-core/lib/parser');
const importRegexp = /^:import\((.+)\)$/;

const pathFetcher = (filepath, relativeTo) =>
    resolve.sync(filepath.replace(/["']/g, ''), {
        basedir: path.dirname(relativeTo),
    });

module.exports = class SyncParser extends AsyncParser {
    plugin(css, result) {
        this.fetchAllImports(css);
        this.linkImportedSymbols(css);
        this.extractExports(css);

        return result;
    }

    fetchImport(importNode, relativeTo, depNr) {
        let file = importNode.selector.match(importRegexp)[1];

        let depTrace = this.trace + String.fromCharCode(depNr);
        const exports = this.pathFetcher(file, relativeTo, depTrace);
        importNode.each(decl => {
            if (decl.type === 'decl') {
                this.translations[decl.prop] = exports[decl.value];
            }
        });
        importNode.remove();
    }
};

module.exports.pathFetcher = pathFetcher;
