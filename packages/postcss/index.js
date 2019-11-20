const postcss = require('postcss');
const createTransform = require('./transform');

const config = {
    scope: 'use',
    stats: false,
    root: false,
};

const fromPairs = x =>
    x.reduce((acc, [key, value]) => ((acc[key] = value), acc), {});

const sortByKeys = obj => fromPairs(Object.entries(obj).sort());

module.exports = postcss.plugin('postcss-reshadow', (options = {}) => {
    const {scope, stats, root: projectRoot} = Object.assign(
        {},
        config,
        options,
    );

    const transform = createTransform({scope});

    return (root, result) => {
        if (
            projectRoot &&
            typeof result.opts.from === 'string' &&
            !result.opts.from.startsWith(projectRoot)
        )
            return;

        const elements = {};
        transform.state = {elements};

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
