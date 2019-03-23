const _Symbol = key => (typeof Symbol !== 'undefined' ? Symbol(key) : key);

export const KEYS = {
    __id__: _Symbol('__id__'),
    __store__: _Symbol('__store__'),
    __prev__: _Symbol('__prev__'),
    __use__: _Symbol('__use__'),
    __elements__: '__elements__',
    __style__: '$$style',
};

let index = 0;

const use = obj => {
    const result = {};
    result[KEYS.__use__] = obj;
    return result;
};

const create = args => {
    const len = args.length;
    let newStyles = {};
    let id = '';

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

        if (style[KEYS.__store__][id]) {
            newStyles = style[KEYS.__store__][id];
            continue;
        }

        newStyles = Object.create(newStyles);

        for (let key in style) {
            if (key in KEYS) continue;

            newStyles[key] = appendClassName(style[key], newStyles[key]);
        }

        style[KEYS.__store__][id] = newStyles;
        newStyles[KEYS.__id__] = index;
    }

    return newStyles;
};

const isSSR = !(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
);

let serverStyles = '';

export const getStyles = () => serverStyles;

const css = (code, hash) => {
    const id = `reshadow-${hash}`;

    if (isSSR) {
        serverStyles += `<style type="text/css" id="${id}">${code}</style>`;
        return;
    }

    let container = document.getElementById('reshadow');
    if (!container) {
        container = document.createElement('object');
        container.id = 'reshadow';
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
const stack = [];

const styled = elem => {
    styles = stack.pop() || styles;
    styled.styles = styles;

    return elem;
};

styled.styles = styles;

const set = args => {
    const newStyles = create(args);

    stack.push(styles);

    styles = newStyles;
    styled.styles = styles;
};

/**
 * This prop is needed for the interop between different component frameworks
 * TODO: think about better solution
 */
styled.classProp = 'className';

export const USE_PREFIX = 'use--';
export const ELEMENT_PREFIX = '__';
export const MOD_PREFIX = '_';
export const MOD_SEPARATOR = '_';

export const parseElement = name => name.replace(ELEMENT_PREFIX, '');

export const parseAttribute = name =>
    name.replace(MOD_PREFIX, '').split(MOD_SEPARATOR);

export const appendClassName = (className, cn = '') => {
    if (className) {
        cn += (cn ? ' ' : '') + className;
    }
    return cn;
};
export const appendElement = (styles, key, cn = '') =>
    appendClassName(styles[ELEMENT_PREFIX + key], cn);

export const appendModifier = (styles, key, value, cn = '') => {
    // isFalsy
    if (
        value === undefined ||
        value === null ||
        value === false ||
        value === ''
    )
        return cn;

    cn = appendClassName(styles[MOD_PREFIX + key], cn);

    if (typeof value !== 'boolean') {
        cn = appendClassName(
            styles[MOD_SEPARATOR + key + MOD_SEPARATOR + value],
            cn,
        );
    }

    return cn;
};

function map(element) {
    let nextProps = {};
    let cn = appendElement(styles, element);
    let style = null;

    const len = arguments.length;

    let useProps;

    for (let i = len - 1; i > 0; i--) {
        let currProps = arguments[i];

        if (!currProps) continue;

        useProps = useProps || currProps[KEYS.__use__];
        style = style || currProps[KEYS.__style__];

        for (let key in currProps) {
            if (
                key === KEYS.__use__ ||
                key === KEYS.__style__ ||
                key in nextProps
            ) {
                continue;
            }

            const value = currProps[key];

            nextProps[key] = value;

            cn = appendModifier(styles, key, value, cn);
        }
    }

    if (useProps) {
        for (let key in useProps) {
            const value = useProps[key];
            cn = appendModifier(styles, USE_PREFIX + key, value, cn);
        }
    }

    cn = appendClassName(nextProps[styled.classProp], cn);

    if (cn) nextProps[styled.classProp] = cn;

    if (style) {
        nextProps.style =
            typeof style === 'string'
                ? style + (nextProps.style || '')
                : Object.assign(style, nextProps.style || {});
    }

    return nextProps;
}

export {use, css, create, set, map, css as __css__};

export default styled;
