import {use, set, create, __css__, KEYS} from '@reshadow/core';
import stringHash from 'string-hash';
import parse from './parse';

export {use};

const cache = {};

function css() {
    const str = arguments[0];
    const hash = stringHash(str.raw.join('')).toString(36);
    let parsed;

    const vars = {};
    for (let i = 1, len = arguments.length; i < len; i++) {
        const name = '--' + hash + '_' + i;
        vars[name] = arguments[i];
    }

    if (cache[hash]) {
        parsed = cache[hash];
    } else {
        const values = [];
        for (let name in vars) {
            values.push('var(' + name + ')');
        }
        const code = String.raw(str, ...values);
        parsed = parse(code, hash);
        __css__(parsed.css, hash);
        cache[hash] = parsed;
    }
    cache[hash].tokens[KEYS.__style__] = vars;
    return cache[hash].tokens;
}

function createStyled(styled) {
    let styles = null;

    function taggedStyled() {
        const str = arguments[0];
        if (!(str[0] && str.raw)) {
            return styled.apply(null, arguments);
        }

        const tokens = css.apply(null, arguments);

        if (styles) {
            styled();
        }

        set([styles, tokens]);
        styles = null;

        return styled;
    }

    function carriedStyled() {
        const str = arguments[0];
        if (str[0] && str.raw) {
            return taggedStyled.apply(null, arguments);
        } else {
            styles = create(Array.prototype.slice.call(arguments));
            set([styles]);
            return taggedStyled;
        }
    }

    return carriedStyled;
}

export {createStyled, css};
