import React from 'react';
import styled, {KEYS, map, use, create} from '@reshadow/core';
import {createStyled, css, keyframes} from '@reshadow/runtime';
import tags from '@reshadow/utils/tags';

export function getDisplayName(Base) {
    return Base.displayName || Base.name || 'Component';
}

function isBuiltInType(type) {
    switch (type) {
        case React.Fragment:
        case React.Profiler:
        case React.StrictMode:
        case React.Suspense: {
            return true;
        }
    }

    return false;
}

export function jsx() {
    const args = Array.prototype.slice.call(arguments);
    let element = args[0];

    if (isBuiltInType(element)) {
        return React.createElement.apply(null, args);
    }

    if (typeof element === 'string' && !tags.has(element)) {
        args[0] = 'div';
    } else if (typeof element === 'function') {
        element = getDisplayName(element);
    }
    args[1] = map(element, args[1]);
    return React.createElement.apply(null, args);
}

export {css, use, create, keyframes};

const reactStyled = createStyled(elem => {
    const style = styled[KEYS.__style__];
    let result = styled(elem);

    if (result === null || result === undefined) {
        return result;
    }

    /**
     * At the moment, we just skip styles inlining with root Fragments
     * TODO(lttb): support dynamic and inline styles for Components with Fragments root node
     */
    if (isBuiltInType(result.type)) {
        return result;
    }

    if (style && result) {
        result = React.cloneElement(result, {
            style: Object.assign({}, style, result.props && result.props.style),
        });
    }
    return result;
});

reactStyled.jsx = jsx;

export default reactStyled;
