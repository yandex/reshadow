const isFalsy = val =>
    val === undefined || val === null || val === false || val === '';

const __id__ = Symbol('__id__');
const __store__ = Symbol('__store__');
const __prev__ = Symbol('__prev__');
const __use__ = Symbol('__use__');

let index = 0;

const PREFIX = 'use--';

const use = obj => {
    const result = {};
    result[__use__] = obj;
    return result;
};

const create = args => {
    const len = args.length;
    let newStyles = {};
    let id = '';

    for (let i = 0; i < len; i++) {
        let style = args[i];

        if (!style) continue;

        if (!(__id__ in style)) {
            style[__id__] = ++index;
            style[__store__] = {
                ['_' + style[__id__]]: style,
            };
        }

        id += '_' + style[__id__];

        if (style[__store__][id]) {
            newStyles = style[__store__][id];
            continue;
        }

        newStyles = Object.create(newStyles);

        for (let key in style) {
            if (newStyles[key]) {
                newStyles[key] += ' ';
            } else {
                newStyles[key] = '';
            }
            newStyles[key] += style[key];
        }

        style[__store__][id] = newStyles;
        newStyles[__id__] = index;
    }

    return newStyles;
};

let styles = {};

const styled = elem => {
    if (styles[__prev__]) {
        styles = styles[__prev__];
        styles[__prev__] = null;
    }

    styled.styles = styles;

    return elem;
};

const css = (code, hash) => {
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

    newStyles[__prev__] = styles;

    styles = newStyles;
    styled.styles = styles;
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

    for (let i = len - 1; i > 0; i--) {
        let currProps = arguments[i];

        let isUse = false;

        if (currProps && __use__ in currProps) {
            isUse = true;
            currProps = currProps[__use__];
        }

        if (!currProps) continue;

        for (let key in currProps) {
            if (key === '__style__') {
                style = currProps.__style__;
                continue;
            }

            const value = currProps[key];

            if (isUse) {
                key = PREFIX + key;
            } else if (key in nextProps) {
                continue;
            } else {
                nextProps[key] = value;
            }

            if (isFalsy(value)) continue;

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
