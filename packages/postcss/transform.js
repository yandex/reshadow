const parser = require('postcss-selector-parser');
const stringHash = require('string-hash');

const isPseudo = node => {
    return parser.isSelector(node) && parser.isPseudo(node.parent);
};

const GLOBAL_PSEUDO = ':global';

const isGlobal = node => {
    const {value} = node.parent;
    return value === GLOBAL_PSEUDO;
};

const SKIP_PSEUDO_LIST = new Set([':dir']);

const isSkippedPseudo = node => {
    const {value} = node.parent;
    return SKIP_PSEUDO_LIST.has(value) || value.startsWith(':nth-');
};

module.exports = ({scope}) => {
    const processNamespace = node => {
        const {parent} = node;

        if (isPseudo(parent)) {
            if (isGlobal(parent)) {
                parent.parent.replaceWith(node);
                return false;
            }

            if (isSkippedPseudo(parent)) {
                return false;
            }
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
    let composes = {};
    let selectorState = {};

    let elementName = '';

    const addElem = tag => {
        elements[tag] = elements[tag] || {mods: {}, props: {}};

        elementName = tag;

        return elements[tag];
    };

    const addMod = node => {
        const {attribute} = node;
        let {value = ''} = node;

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
            name = `-${attribute}`;
            type = 'mods';
        } else {
            name = attribute;
            type = 'props';
        }

        const values = elem[type];

        values[name] = values[name] || new Set();
        values[name].add(value || true);

        selectorState[name] = value || true;

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

        selectorState = {};

        selectors.walkPseudos(node => {
            if (!processNamespace(node)) {
                return;
            }

            const {value} = node;

            if (value !== ':root') return;

            node.replaceWith(
                parser.attribute({attribute: 'root', namespace: 'use'}),
            );
        });

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

        if (Object.keys(selectorState).length > 0) {
            const hash = stringHash(rule.selector).toString(16);
            const hashSelector = `_${hash}`;

            let inc = 0;

            rule.walkDecls('composes', decl => {
                // composesRule.append(decl.clone());
                // decl.remove();

                inc++;
            });

            const vars = {};

            rule.walkAtRules('__PLACEHOLDER__', atRule => {
                vars[atRule.params.replace(/_(.*?)_/, '$1')] = true;
                inc++;
                atRule.remove();
            });

            if (inc > 0) {
                const composesRule = rule.clone({selector: `.${hashSelector}`});

                rule.parent.insertAfter(rule, composesRule);

                // remove the original rule
                rule.remove();

                // rule.selector = composesRule.selector;

                selectorState.__keys__ = Object.keys(selectorState).length;

                selectorState.__value__ = hashSelector;
                if (rule.nodes.length === inc) {
                    selectorState.__empty__ = true;
                }
                if (Object.keys(vars).length > 0) {
                    selectorState.__vars__ = vars;
                }
                composes[elementName] = composes[elementName] || [];
                composes[elementName].push(selectorState);
            }
        }
    };

    const processor = parser(transform);

    return {
        get state() {
            return {elements, composes};
        },
        set state(values) {
            ({elements = {}, composes = {}} = values);
        },
        run(currentRule) {
            rule = currentRule;
            return processor.processSync(rule);
        },
    };
};
