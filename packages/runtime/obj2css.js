/**
 * styled-components objToCss version
 * @see https://github.com/styled-components/styled-components/
 */

import unitless from '@emotion/unitless';

const isPlainObject = x => typeof x === 'object' && x.constructor === Object;

/**
 * inlined version of
 * https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/hyphenateStyleName.js
 */

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 *
 * @param {string} string
 * @return {string}
 */
function hyphenateStyleName(string) {
    return string
        .replace(uppercasePattern, '-$1')
        .toLowerCase()
        .replace(msPattern, '-ms-');
}

//

// Taken from https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/shared/dangerousStyleValue.js
function addUnitIfNeeded(name, value) {
    // https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/133
    // $FlowFixMe
    if (value == null || typeof value === 'boolean' || value === '') {
        return '';
    }

    if (typeof value === 'number' && value !== 0 && !(name in unitless)) {
        return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
    }

    return String(value).trim();
}

//

/**
 * It's falsish not falsy because 0 is allowed.
 */
function isFalsish(chunk) {
    return (
        chunk === undefined || chunk === null || chunk === false || chunk === ''
    );
}

function objToCss(obj, prevKey) {
    const css = Object.keys(obj)
        .filter(function(key) {
            return !isFalsish(obj[key]);
        })
        .map(function(key) {
            if (isPlainObject(obj[key])) return objToCss(obj[key], key);
            return (
                hyphenateStyleName(key) +
                ': ' +
                addUnitIfNeeded(key, obj[key]) +
                ';'
            );
        })
        .join(' ');
    return prevKey ? prevKey + ' {\n  ' + css + '\n}' : css;
}

export default objToCss;
