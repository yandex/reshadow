const postcss = require('postcss');
const parser = require('postcss-selector-parser');

/**
 * Temporary solution to skip cosmiconfig usage
 */
const config = {
    namespace: 'use',
};

const fromPairs = x =>
    x.reduce((acc, [key, value]) => ((acc[key] = value), acc), {});

const sortByKeys = obj => fromPairs(Object.entries(obj).sort());

module.exports = postcss.plugin('postcss-reshadow', (options = {}) => {
    const {scope = config.namespace} = options;

    const processNamespace = node => {
        if (node.namespace === 'html') {
            node.namespace = '';
            return false;
        }

        return (
            !node.namespace ||
            node.namespace === scope ||
            node.namespace === true
        );
    };

    const MOD_PREFIX = '_';
    const ELEM_PREFIX = '__';

    return (root, result) => {
        const elements = {};

        const addElem = tag => {
            elements[tag] = elements[tag] || {mods: {}, props: {}};

            return elements[tag];
        };

        const addMod = node => {
            let {attribute, value = ''} = node;

            let prev = node.prev();

            while (
                prev &&
                !(parser.isTag(prev) || parser.isIdentifier(prev)) &&
                !parser.isCombinator(prev)
            ) {
                const curr = prev;
                prev = curr.prev();

                if (parser.isPseudo(curr)) {
                    continue;
                } else if (!parser.isAttribute(curr)) {
                    continue;
                }
            }

            const tag = (prev && prev.value) || '__common__';

            value = value.replace(/^['"]/, '').replace(/['"]$/, '');

            let name;
            let type;

            const elem = addElem(tag);

            if (node.namespace) {
                name = `${scope}--${attribute}`;
                type = 'mods';
            } else {
                name = attribute;
                type = 'props';
            }

            const values = elem[type];

            values[name] = values[name] || new Set();
            values[name].add(value);

            const modName = MOD_PREFIX + name;

            const className = `${modName}`;
            const classNames = [className];

            if (value) {
                classNames.push(`${modName}_${value}`);
            }

            return {
                type,
                classNames,
            };
        };

        let rule;

        const transform = selectors => {
            const hashes = new Set();

            selectors.walkAttributes(node => {
                if (!processNamespace(node)) {
                    return;
                }

                const hash = `${node.namespace || ''}${
                    node.attribute
                }${node.value || ''}`;

                hashes.add(hash);

                const {classNames} = addMod(node);

                if (!classNames) return;

                node.replaceWith(
                    parser.className({value: classNames.join('.')}),
                );
            });

            selectors.walkTags(node => {
                /**
                 * Workaround for the nested namespaced elements
                 */
                const prev = node.prev();
                if (parser.isCombinator(prev) && prev.value === '|') {
                    prev.value = '';
                    node.namespace = true;
                }

                if (!processNamespace(node)) {
                    return;
                }

                const {value} = node;

                let name;

                if (node.namespace) {
                    name = `${scope}--${value}`;
                } else {
                    name = value;
                }

                addElem(name);

                const className = `${ELEM_PREFIX}${name}`;

                node.replaceWith(parser.className({value: className}));
            });
        };

        const processor = parser(transform);

        root.walkRules(ruleDecl => {
            rule = ruleDecl;

            rule.selector = rule.selector.replace(
                /]\\?=(['"].*?['"]|[\w]+)/g,
                '=$1]',
            );

            const selector = processor.processSync(rule);

            rule.selector = selector;
        });

        Object.entries(elements).forEach(([, value]) => {
            const {mods, props} = value;

            value.mods = sortByKeys(mods);
            value.props = sortByKeys(props);
        });

        root.append({
            name: 'value',
            params: `__elements__: '${JSON.stringify(elements, (key, value) => {
                if (value instanceof Set) return Array.from(value);

                return value;
            })}'`,
        });
    };
});
