const parser = require('postcss-selector-parser');

module.exports = ({scope}) => {
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

    let elements = {};

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

            node.replaceWith(parser.className({value: classNames.join('.')}));
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

    return {
        get state() {
            return {elements};
        },
        set state(values) {
            ({elements} = values);
        },
        run(currentRule) {
            rule = currentRule;
            return processor.processSync(rule);
        },
    };
};
