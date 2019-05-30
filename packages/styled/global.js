import React from 'react';
import {
    createStyled as createReshadowStyled,
    createCSS,
} from '@reshadow/runtime';
import coreStyled, {KEYS} from '@reshadow/core';
import stylis from 'stylis';
import styled from '.';

const globalCSS = createCSS({
    parse: code => {
        stylis.use(null);
        return {css: stylis('', code), tokens: {}};
    },
});

class GlobalStyle extends React.Component {
    render() {
        // eslint-disable-next-line
        const {style} = this.props;
        if (style) {
            for (let name in style) {
                document.documentElement.style.setProperty(name, style[name]);
            }
        }

        return null;
    }
}

const globalReshadowStyled = createReshadowStyled((as, props) => {
    let style = coreStyled[KEYS.__style__];

    props.style = style;

    return React.createElement(GlobalStyle, props);
}, globalCSS);

export const createGlobalStyle = (strs, ...values) =>
    styled(GlobalStyle).create({
        wrap: (element, strs) => strs,
        styled: globalReshadowStyled,
    })(strs, ...values);
