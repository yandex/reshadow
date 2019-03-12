const _Symbol = key => (typeof Symbol !== 'undefined' ? Symbol(key) : key);

const KEYS = {
    __id__: _Symbol('__id__'),
    __store__: _Symbol('__store__'),
    __prev__: _Symbol('__prev__'),
    __use__: _Symbol('__use__'),
};

let index = 0;

const PREFIX = 'use--';

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

            if (newStyles[key]) {
                newStyles[key] += ' ';
            } else {
                newStyles[key] = '';
            }
            newStyles[key] += style[key];
        }

        style[KEYS.__store__][id] = newStyles;
        newStyles[KEYS.__id__] = index;
    }

    return newStyles;
};

let styles = {};

const styled = elem => {
    if (styles[KEYS.__prev__]) {
        styles = styles[KEYS.__prev__];
        styles[KEYS.__prev__] = null;
    }

    styled.styles = styles;

    return elem;
};

const isSSR = !(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
);

const css = (code, hash) => {
    if (isSSR) return;

    let container = document.getElementById('reshadow');
    if (!container) {
        container = document.createElement('object');
        container.id = 'reshadow';
        document.head.appendChild(container);
    }
    const id = `reshadow-${hash}`;
    let css = document.getElementById(id);
    if (!css) {
        css = document.createElement('style');
        css.id = id;
        css.type = 'text/css';
        container.appendChild(css);
    }

    css.innerHTML = code;
};

const set = args => {
    const newStyles = create(args);

    newStyles[KEYS.__prev__] = styles;

    styles = newStyles;
    styled.styles = styles;
};

const appendClassname = (cn, key, value) => {
    // isFalsy
    if (
        value === undefined ||
        value === null ||
        value === false ||
        value === ''
    )
        return cn;

    let className = styles[`_${key}`];
    if (className) {
        cn += (cn ? ' ' : '') + className;
    }

    if (typeof value !== 'boolean') {
        className = styles[`_${key}_${value}`];
        if (className) {
            cn += (cn ? ' ' : '') + className;
        }
    }

    return cn;
};

/**
 * This prop is needed for the interop between different component frameworks
 * TODO: think about better solution
 */
styled.classProp = 'className';

function map(element) {
    let nextProps = {};
    let cn = styles[`__${element}`] || '';
    let style = null;

    const len = arguments.length;

    let useProps;

    for (let i = len - 1; i > 0; i--) {
        let currProps = arguments[i];

        if (!currProps) continue;

        useProps = useProps || currProps[KEYS.__use__];
        style = style || currProps.__style__;

        for (let key in currProps) {
            if (
                key === KEYS.__use__ ||
                key === '__style__' ||
                key in nextProps
            ) {
                continue;
            }

            const value = currProps[key];

            nextProps[key] = value;

            cn = appendClassname(cn, key, value);
        }
    }

    if (useProps) {
        for (let key in useProps) {
            const value = useProps[key];
            cn = appendClassname(cn, PREFIX + key, value);
        }
    }

    if (nextProps[styled.classProp]) {
        cn += (cn ? ' ' : '') + nextProps[styled.classProp];
    }

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

export default Object.assign(styled, {
    styles,
    use,
    css,
    create,
    set,
    map,
});
