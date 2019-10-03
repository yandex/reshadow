const postcss = require('postcss');
const createTransform = require('./transform');

const config = {
    scope: 'use',
    stats: false,
};

const fromPairs = x =>
    x.reduce((acc, [key, value]) => ((acc[key] = value), acc), {});

const sortByKeys = obj => fromPairs(Object.entries(obj).sort());

module.exports = postcss.plugin('postcss-reshadow', (options = {}) => {
    const {scope, stats} = {...config, ...options};

    const transform = createTransform({scope});

    return (root, result) => {
        transform.state = {};

        root.walkRules(ruleDecl => {
            const rule = ruleDecl;

            if (
                rule.parent.type === 'atrule' &&
                rule.parent.name.endsWith('keyframes')
            ) {
                return;
            }

            rule.selector = rule.selector.replace(
                /]\\?=(['"].*?['"]|[\w]+)/g,
                '=$1]',
            );

            const selector = transform.run(rule);

            rule.selector = selector;
        });

        const {elements, composes} = transform.state;

        if (Object.keys(composes).length > 0) {
            root.append({
                name: 'value',
                params: `__comp__: '${JSON.stringify(composes)}'`,
            });
        }

        Object.entries(elements).forEach(([, value]) => {
            const {mods, props} = value;

            value.mods = sortByKeys(mods);
            value.props = sortByKeys(props);
        });

        if (stats) {
            root.append({
                name: 'value',
                params: `__elements__: '${JSON.stringify(
                    elements,
                    (key, value) => {
                        if (value instanceof Set) return Array.from(value);

                        return value;
                    },
                )}'`,
            });
        }
    };
});
