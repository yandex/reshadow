/* eslint-disable guard-for-in */

const _Symbol = key => (typeof Symbol !== 'undefined' ? Symbol(key) : key);

const KEYS = {
    __id__: _Symbol('__id__'),
    __store__: _Symbol('__store__'),
    __prev__: _Symbol('__prev__'),
    __use__: _Symbol('__use__'),
    __composes__: _Symbol('__composes__'),
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

function create() {
    const len = arguments.length;
    let newStyle = {};
    let id = '';
    let vars = null;
    let uses = null;
    const composes = {};

    for (let i = 0; i < len; i++) {
        const style = arguments[i];

        if (!style) continue;

        if (!style[KEYS.__id__]) {
            style[KEYS.__id__] = ++index;
            style[KEYS.__store__] = {
                [`_${style[KEYS.__id__]}`]: style,
            };
        }

        id += `_${style[KEYS.__id__]}`;

        if (style[KEYS.__style__]) {
            vars = Object.assign(vars || {}, style[KEYS.__style__]);
        }

        if (style[KEYS.__use__]) {
            uses = Object.assign(uses || {}, style[KEYS.__use__]);
        }

        if (style.__comp__) {
            if (typeof style.__comp__ === 'string') {
                style.__comp__ = JSON.parse(style.__comp__.slice(1, -1));
            }
            for (const elem in style.__comp__) {
                composes[elem] = composes[elem] || [];
                composes[elem].push(...style.__comp__[elem]);
            }
        }

        if (style[KEYS.__store__][id]) {
            newStyle = style[KEYS.__store__][id];
            continue;
        }

        newStyle = Object.create(newStyle);

        for (const key in style) {
            if (key in KEYS) continue;

            newStyle[key] = appendClassName(style[key], newStyle[key]);
        }

        style[KEYS.__store__][id] = newStyle;
        newStyle[KEYS.__id__] = index;
        newStyle[KEYS.__store__] = {
            [`_${style[KEYS.__id__]}`]: newStyle,
        };

        newStyle.__comp__ = composes;
    }

    if (vars || use) {
        newStyle = Object.create(newStyle);
        newStyle[KEYS.__style__] = vars;
        newStyle[KEYS.__use__] = uses;
    }

    return newStyle;
}

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
        for (const id in serverMap) {
            serverStyles += `<style type="text/css" id="${id}">${serverMap[id]}</style>`;
        }
        return serverStyles;
    },
});

/* eslint-disable no-undef */
const clearStyles = () => {
    serverStyles = '';
};
/* eslint-disable no-undef */

const RESHADOW_ID = '__reshadow__';

const inject = (code, hash, styles) => {
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

    styles.__hash__ = hash;
    return styles;
};

const __fn__ = styles => {
    const fn = props => {
        const result = __map__(styles, {'-root': true, ...props});
        return result;
    };
    Object.setPrototypeOf(fn, styles);
    return fn;
};

const __css__ = (styles, mappers = {}) => {
    const hash = styles.__hash__;
    if (typeof styles.__comp__ === 'string') {
        styles.__comp__ = JSON.parse(styles.__comp__.slice(1, -1));
    }
    return Object.assign(__fn__(styles), {
        __with__() {
            const _styles = Object.create(styles);
            const vars = {};

            const len = arguments.length;
            for (let i = 0; i < len; i++) {
                const name = `--_${hash}-${i}`;
                vars[name] = arguments[i];
                if (i in mappers) {
                    vars[name] = mappers[i][0] + vars[name] + mappers[i][1];
                }
            }

            _styles[KEYS.__style__] = vars;
            return __fn__(_styles);
        },
    });
};

let styles = {};
let style;
const stack = [];

const _styled = elem => {
    const curr = stack.pop() || [];

    styles = curr[0] || styles;
    style = curr[1] || style;

    styled[KEYS.__styles__] = styles;
    styled[KEYS.__style__] = style;

    return elem;
};

function styled() {
    const newStyles = create.apply(null, arguments);

    stack.push([styles, style]);

    styles = newStyles;
    style = styles[KEYS.__style__];
    if (styles[KEYS.__style__]) {
        style = style
            ? {...style, ...styles[KEYS.__style__]}
            : styles[KEYS.__style__];
    }
    styled[KEYS.__styles__] = styles;
    styled[KEYS.__style__] = style;

    return _styled;
}

styled[KEYS.__styles__] = styles;

const USE_PREFIX = '-';
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

function processCompositionQueue(queue, done, key, value) {
    const nextQueue = [];

    for (const compose of queue) {
        if (compose[key] === value) {
            compose.__$keys__--;
            if (compose.__$keys__ === 0) {
                done.push(compose);
            } else {
                nextQueue.push(compose);
            }
        } else if (!(key in compose)) {
            nextQueue.push(compose);
        }
    }

    return nextQueue;
}

function buildQueue(element, styles) {
    const currStyles = styles;
    const composes = currStyles.__comp__ || {};

    const elementComposes = composes[element] || [];
    const commonComposes = composes.__common__ || [];
    const queue = [];
    for (
        let i = 0,
            len = Math.max(elementComposes.length, commonComposes.length);
        i < len;
        i++
    ) {
        if (elementComposes[i]) {
            elementComposes[i].__$keys__ = Number(elementComposes[i].__keys__);
            queue.push(elementComposes[i]);
        }
        if (commonComposes[i]) {
            commonComposes[i].__$keys__ = Number(commonComposes[i].__keys__);
            queue.push(commonComposes[i]);
        }
    }
    return queue;
}

function __map__(styles, props) {
    let cn = '';
    const currStyles = styles;
    const currProps = props;
    const vars = {...styles[KEYS.__style__]};

    let queue = buildQueue('', currStyles);
    const done = [];

    for (const key in currProps) {
        if (key === KEYS.__use__ || key === KEYS.__style__) {
            continue;
        }

        const value = currProps[key];

        cn = appendModifier(currStyles, key, value, cn);

        queue = processCompositionQueue(queue, done, key, value);
    }

    for (let i = 0; i < done.length; i++) {
        const currDone = done[i];
        let composed = currStyles[currDone.__value__];
        composed = composed.replace(/\\:/g, ':');
        cn = appendClassName(composed, cn);
        if (currDone.__vars__) {
            for (const v in currDone.__vars__) {
                const key = `--_${v}`;
                if (!(key in vars)) continue;
                cn = appendClassName(vars[key]['_-root'], cn);
                Object.assign(vars, vars[key][KEYS.__style__]);
                delete vars[key];
            }
        }
    }

    return {[KEYS.__style__]: vars, '_-root': cn};
}

function map(element) {
    const currStyles = styled[KEYS.__styles__];
    const nextProps = {};
    let cn = appendElement(currStyles, element);
    const vars = {...styled[KEYS.__style__]};
    const uses = currStyles[KEYS.__use__] || {};

    let queue = buildQueue(element, currStyles);
    const done = [];

    const len = arguments.length;

    let useProps;

    for (let i = len - 1; i > 0; i--) {
        const currProps = arguments[i];

        if (!currProps) continue;

        useProps = useProps || currProps[KEYS.__use__];

        for (const key in currProps) {
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
                const useKey = `${key}_${value}`;
                if (`${key}_${true}` in uses || useKey in uses) {
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

            queue = processCompositionQueue(queue, done, key, value);
        }
    }

    if (useProps) {
        for (const mod in useProps) {
            const value = useProps[mod];
            const key = USE_PREFIX + mod;
            cn = appendModifier(currStyles, key, value, cn);

            queue = processCompositionQueue(queue, done, key, value);
        }
    }

    cn = appendClassName(nextProps[KEYS.__classProp__], cn);

    for (let i = 0; i < done.length; i++) {
        const currDone = done[i];
        let composed = currStyles[currDone.__value__];
        composed = composed.replace(/\\:/g, ':');
        cn = appendClassName(composed, cn);
        if (currDone.__vars__) {
            for (const v in currDone.__vars__) {
                const key = `--_${v}`;
                if (!(key in vars)) continue;
                cn = appendClassName(vars[key]['_-root'], cn);
                Object.assign(vars, vars[key][KEYS.__style__]);
                delete vars[key];
            }
        }
    }

    if (cn) nextProps[KEYS.__classProp__] = cn;

    if (vars) {
        nextProps.style =
            typeof style === 'string'
                ? vars + (nextProps.style || '')
                : Object.assign(vars, nextProps.style || {});
    }

    return nextProps;
}

module.exports = {
    __esModule: true,
    default: styled,
    use,
    inject,
    create,
    map,
    __css__,
    __extract__: () => ({
        [KEYS.__styles__]: styled[[KEYS.__styles__]],
        [KEYS.__style__]: styled[[KEYS.__style__]],
    }),

    // ssr
    getStyles,
    clearStyles,

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
