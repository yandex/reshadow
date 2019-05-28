import React from 'react';
import styled, {KEYS, map, create} from '@reshadow/core';
import {createStyled, css} from '@reshadow/runtime';
import tags from '@reshadow/utils/html-tags';

export function getDisplayName(Base) {
    return Base.displayName || Base.name || 'Component';
}

export function jsx() {
    const args = Array.prototype.slice.call(arguments);
    let element = args[0];
    if (typeof element === 'string' && !tags.has(element)) {
        args[0] = 'div';
    } else if (typeof element === 'function') {
        element = getDisplayName(element);
    }
    args[1] = map(element, args[1]);
    return React.createElement.apply(null, args);
}

export {css, create};

const reactStyled = createStyled(elem => {
    let style = styled[KEYS.__style__];
    let result = styled(elem);
    if (style && result) {
        result = React.cloneElement(result, {
            style: Object.assign({}, style, result.props.style),
        });
    }
    return result;
});

reactStyled.jsx = jsx;

export default reactStyled;
