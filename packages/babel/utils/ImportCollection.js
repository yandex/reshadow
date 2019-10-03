const t = require('@babel/types');
const {addDefault} = require('@babel/helper-module-imports');

class ImportCollection {
    constructor(utils) {
        this.utils = utils;
        this.node = null;
        this.map = {};

        this.coreModule = '@reshadow/core';
        this.defaultName = 'styled';

        this.init();
    }

    isStylesImport(source) {
        this.CSS_RE =
            this.CSS_RE || this.utils.options.files
                ? new RegExp(this.utils.options.files)
                : null;

        return this.CSS_RE && this.CSS_RE.test(source);
    }

    isReshadowImport(source) {
        return [
            'reshadow',
            this.coreModule,
            this.utils.options.source,
        ].includes(source);
    }

    init() {
        const nodePath = this.utils.path
            .get('body')
            .find(({node: currentNode}) => {
                return (
                    t.isImportDeclaration(currentNode) &&
                    this.isReshadowImport(currentNode.source.value)
                );
            });

        if (!nodePath) return;

        const {node} = nodePath;

        node.source.value = this.coreModule;

        this.node = node;
        this.map = node.specifiers.reduce((acc, spec) => {
            const name = t.isImportDefaultSpecifier(spec)
                ? this.defaultName
                : spec.imported.name;

            acc[name] = spec.local.name;

            return acc;
        }, {});
    }

    is(name, varName) {
        return this.map[name] && this.map[name] === varName;
    }

    add(name) {
        if (!this.node) {
            addDefault(this.utils.path, this.coreModule, {
                nameHint: this.defaultName,
            });

            this.init();
        }

        if (this.map[name]) return this.map[name];

        const localName = this.utils.scope.getName(name);

        if (name === this.defaultName) {
            this.node.specifiers.unshift(
                t.importDefaultSpecifier(t.identifier(localName)),
            );
        } else {
            this.node.specifiers.push(
                t.importSpecifier(t.identifier(localName), t.identifier(name)),
            );
        }

        this.map[name] = localName;

        return localName;
    }
}

module.exports = ImportCollection;
