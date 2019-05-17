import styled from '@reshadow/core';

export const __init__ = (
    {beforeUpdate, afterUpdate},
    getStyles,
    invalidate,
) => {
    let prevStyles = {};

    beforeUpdate(() => {
        const styles = getStyles();

        Object.assign(styled, styles);

        if (styles.styles !== prevStyles.styles) {
            invalidate();
        }

        prevStyles = styles;
    });
};
