import {use, set, create, __css__, KEYS} from '@reshadow/core';
import stringHash from 'string-hash';
import parse from './parse';

export {use};

const cache = {};

function css() {
    const str = arguments[0];
    const hash = stringHash(str.raw.join('')).toString(36);
    let mixinsHash = '';
    let parsed;

    const vars = {};
    const mixins = {};

    for (let i = 1, len = arguments.length; i < len; i++) {
        const value = arguments[i];
        if (typeof value === 'object') {
            Object.assign(vars, value[KEYS.__style__]);
            mixinsHash += '_' + value[KEYS.__hash__];
            mixins[i] = value[KEYS.__css__];
        } else {
            const name = '--' + hash + '_' + i;
            vars[name] = value;
        }
    }

    const cacheKey = stringHash(hash + mixinsHash).toString(36);

    if (cache[cacheKey]) {
        parsed = cache[cacheKey];
    } else {
        const keys = Object.keys(vars);
        let pointer = 0;

        const values = [];
        for (let i = 1; i < arguments.length; i++) {
            if (i in mixins) {
                values.push(mixins[i]);
            } else {
                values.push('var(' + keys[pointer] + ')');
                pointer++;
            }
        }

        let code = String.raw(str, ...values);
        let keyframe = true;
        let prefix = true;

        if (/^[\r\n\s]*\w+:/.test(code)) {
            code = '& {' + code + '}';
            keyframe = false;
            prefix = false;
        }

        parsed = parse(code, cacheKey, {keyframe, prefix});

        if (parsed.css[0] === '{') {
            parsed.css =
                '&' +
                parsed.css
                    .replace(new RegExp(`\\.___${cacheKey}`, 'g'), '&')
                    .replace(/\}\{/g, '}&{');
        } else {
            __css__(parsed.css, cacheKey);
        }

        parsed.tokens[KEYS.__hash__] = cacheKey;
        parsed.tokens[KEYS.__css__] = parsed.css;

        cache[cacheKey] = parsed;
    }

    const tokens = Object.create(cache[cacheKey].tokens);

    tokens[KEYS.__style__] = vars;
    return tokens;
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

        return styled;
    }

    function carriedStyled() {
        const str = arguments[0];
        styles = null;
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
