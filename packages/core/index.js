const _Symbol = key => (typeof Symbol !== 'undefined' ? Symbol(key) : key);

const KEYS = {
    __id__: _Symbol('__id__'),
    __store__: _Symbol('__store__'),
    __prev__: _Symbol('__prev__'),
    __use__: _Symbol('__use__'),
    __elements__: '__elements__',
    __style__: '$$style',
    __styles__: 'styles',

    __css__: '__css__',
    __hash__: '__hash__',

    /**
     * This prop is needed for the interop between different component frameworks
     */
    __classProp__: 'className',
};

let index = 0;

const use = obj => {
    const result = {};
    result[KEYS.__use__] = obj;
    return result;
};

const create = args => {
    const len = args.length;
    let newStyle = {};
    let id = '';
    let vars = null;
    let uses = null;

    for (let i = 0; i < len; i++) {
        let style = args[i];

        if (!style) continue;

        if (!(KEYS.__id__ in style)) {
            style[KEYS.__id__] = ++index;
            style[KEYS.__store__] = {
                ['_' + style[KEYS.__id__]]: style,
            };
        }

        id += '_' + style[KEYS.__id__];

        if (style[KEYS.__style__]) {
            vars = Object.assign(vars || {}, style[KEYS.__style__]);
        }

        if (style[KEYS.__use__]) {
            uses = Object.assign(uses || {}, style[KEYS.__use__]);
        }

        if (style[KEYS.__store__][id]) {
            newStyle = style[KEYS.__store__][id];
            continue;
        }

        newStyle = Object.create(newStyle);

        for (let key in style) {
            if (key in KEYS) continue;

            newStyle[key] = appendClassName(style[key], newStyle[key]);
        }

        style[KEYS.__store__][id] = newStyle;
        newStyle[KEYS.__id__] = index;
        newStyle[KEYS.__store__] = {
            ['_' + style[KEYS.__id__]]: newStyle,
        };
    }

    if (vars || use) {
        newStyle = Object.create(newStyle);
        newStyle[KEYS.__style__] = vars;
        newStyle[KEYS.__use__] = uses;
    }

    return newStyle;
};

const isSSR = !(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
);

const serverMap = {};

const getStyles = () => ({
    map: serverMap,
    get css() {
        let serverStyles = '';
        for (let id in serverMap) {
            serverStyles += `<style type="text/css" id="${id}">${
                serverMap[id]
            }</style>`;
        }
        return serverStyles;
    },
});

const RESHADOW_ID = '__reshadow__';

const css = (code, hash) => {
    const id = `reshadow-${hash}`;

    if (isSSR) {
        serverMap[id] = code;
        return;
    }

    let container = document.getElementById(RESHADOW_ID);
    if (!container) {
        container = document.createElement('object');
        container.id = RESHADOW_ID;
        document.head.appendChild(container);
    }
    let css = document.getElementById(id);
    if (!css) {
        css = document.createElement('style');
        css.id = id;
        css.type = 'text/css';
        container.appendChild(css);
    }

    css.innerHTML = code;
};

let styles = {};
let style;
const stack = [];

const styled = elem => {
    const curr = stack.pop() || [];

    styles = curr[0] || styles;
    style = curr[1] || style;

    styled[KEYS.__styles__] = styles;
    styled[KEYS.__style__] = style;

    return elem;
};

styled[KEYS.__styles__] = styles;

const set = (args, newStyle) => {
    const newStyles = create(args);

    stack.push([styles, style]);

    styles = newStyles;
    style = newStyle;
    if (styles[KEYS.__style__]) {
        style = style
            ? Object.assign({}, style, styles[KEYS.__style__])
            : styles[KEYS.__style__];
    }
    styled[KEYS.__styles__] = styles;
    styled[KEYS.__style__] = style;
};

const USE_PREFIX = 'use--';
const ELEMENT_PREFIX = '__';
const MOD_PREFIX = '_';
const MOD_SEPARATOR = '_';

const parseElement = name => name.replace(ELEMENT_PREFIX, '');

const parseAttribute = name =>
    name.replace(MOD_PREFIX, '').split(MOD_SEPARATOR);

const appendClassName = (className, cn = '') => {
    if (className) {
        cn += (cn ? ' ' : '') + className;
    }
    return cn;
};
const appendElement = (styles, key, cn = '') =>
    appendClassName(styles[ELEMENT_PREFIX + key], cn);

const appendModifier = (styles, key, value, cn = '') => {
    // isFalsy
    if (
        value === undefined ||
        value === null ||
        value === false ||
        value === ''
    )
        return cn;

    cn = appendClassName(styles[MOD_PREFIX + key], cn);

    // value should be only primitive
    if (
        typeof value === 'boolean' ||
        typeof value === 'object' ||
        typeof value === 'function'
    )
        return cn;

    cn = appendClassName(
        styles[MOD_SEPARATOR + key + MOD_SEPARATOR + value],
        cn,
    );

    return cn;
};

function map(element) {
    const currStyles = styled[KEYS.__styles__];
    let nextProps = {};
    let cn = appendElement(currStyles, element);
    let vars = null;
    let uses = currStyles[KEYS.__use__] || {};

    const len = arguments.length;

    let useProps;

    for (let i = len - 1; i > 0; i--) {
        let currProps = arguments[i];

        if (!currProps) continue;

        useProps = useProps || currProps[KEYS.__use__];

        if (!vars && KEYS.__style__ in currProps) {
            vars = styled[KEYS.__style__];
        }

        for (let key in currProps) {
            if (
                key === KEYS.__use__ ||
                key === KEYS.__style__ ||
                key in nextProps
            ) {
                continue;
            }

            const value = currProps[key];

            cn = appendModifier(currStyles, key, value, cn);

            const valueType = typeof value;

            if (
                valueType === 'string' ||
                valueType === 'boolean' ||
                valueType === 'number'
            ) {
                const useKey = key + '_' + value;
                if (key + '_' + true in uses || useKey in uses) {
                    cn = appendModifier(
                        currStyles,
                        USE_PREFIX + key,
                        value,
                        cn,
                    );

                    if (uses[useKey]) {
                        continue;
                    }
                }
            }

            nextProps[key] = value;
        }
    }

    if (useProps) {
        for (let key in useProps) {
            const value = useProps[key];
            cn = appendModifier(currStyles, USE_PREFIX + key, value, cn);
        }
    }

    cn = appendClassName(nextProps[KEYS.__classProp__], cn);

    if (cn) nextProps[KEYS.__classProp__] = cn;

    if (vars) {
        nextProps.style =
            typeof style === 'string'
                ? vars + (nextProps.style || '')
                : Object.assign({}, vars, nextProps.style || {});
    }

    return nextProps;
}

module.exports = {
    __esModule: true,
    default: styled,
    use,
    css,
    create,
    set,
    map,
    __css__: css,
    __extract__: () => ({
        [KEYS.__styles__]: styled[[KEYS.__styles__]],
        [KEYS.__style__]: styled[[KEYS.__style__]],
    }),

    // ssr
    getStyles,

    // utils
    appendModifier,
    appendElement,
    appendClassName,
    parseAttribute,
    parseElement,

    // constants
    MOD_SEPARATOR,
    MOD_PREFIX,
    ELEMENT_PREFIX,
    USE_PREFIX,
    KEYS,
    RESHADOW_ID,
};
