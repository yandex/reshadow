import React from 'react';
import {getDisplayName} from '@reshadow/react';
import {
    keyframes,
    createStyled as createReshadowStyled,
    wrap,
    createCSS,
} from '@reshadow/runtime';
import coreStyled, {KEYS, map} from '@reshadow/core';
import tags from '@reshadow/utils/html-tags';
import {ThemeContext} from 'theming';
import isReactProp from 'is-react-prop';

const ThemeConsumer = ThemeContext.Consumer;

const styledProps = ['as', 'theme'];
const blacklist = new Set([...styledProps, 'color']);

const filterProps = props => {
    const nextProps = {};
    const filtered = Object.create(styledProps);
    Object.keys(props).forEach(prop => {
        nextProps[prop] = props[prop];
        if (blacklist.has(prop) || !isReactProp(prop)) {
            filtered.push(prop);
        }
    });
    return {props: nextProps, filtered};
};

const __css__ = createCSS({
    elements: false,
    classes: false,
    attributes: true,
    onlyNamespaced: true,
});

const mixin = value => {
    if (value[0] === "'" || value[0] === '"' || value.indexOf(':') === -1) {
        return value;
    }

    return __css__([value]);
};

function css() {
    const str = [...arguments[0]];
    const functions = {};
    const args = [str];

    for (let i = 1, len = arguments.length; i < len; i++) {
        const value = arguments[i];
        args[i] = value;

        if (typeof value === 'function') {
            functions[i] = value;
        } else if (typeof value === 'string') {
            args[i] = mixin(value);
        }
    }

    const keys = Object.keys(functions);

    if (keys.length === 0) {
        return __css__.apply(null, args);
    }

    return data => {
        const nextArgs = Object.create(args);
        for (let index in functions) {
            let value = functions[index](data);
            if (typeof value === 'string') {
                value = mixin(value);
            }

            while (typeof value === 'function') value = value(data);

            nextArgs[index] = value;
        }
        return __css__.apply(null, nextArgs);
    };
}

const reshadowStyled = createReshadowStyled((element, as, props, filtered) => {
    let style = coreStyled[KEYS.__style__];

    if (style) {
        props.style = Object.assign({}, style, props.style);
    }

    props = map(element, props);

    if (filtered) {
        for (let i = 0; i < filtered.length; i++) {
            delete props[filtered[i]];
        }
    }

    const result = React.createElement(as, props);

    if (style && result.props.style === props.style) {
        return result;
    }

    return React.cloneElement(result, {
        style: Object.assign({}, style, result.props.style),
    });
}, css);

const createStyled = tag => {
    const create = (options = {}) => (strs, ...values) => {
        const isComponent = typeof tag !== 'string';
        const element = isComponent ? getDisplayName(tag) : tag;
        const elementClassName = '.__root__';

        if (typeof strs === 'function') {
            values = [strs];
            strs = ['', ''];
        }

        const wrapper = (options.wrap || wrap)(elementClassName, [...strs]);

        class StyledComponent extends React.Component {
            constructor() {
                super();
                this.innerRender = this.innerRender.bind(this);
            }

            mapValues(props) {
                const result = [];
                for (let i = 0; i < values.length; i++) {
                    let value = values[i];

                    while (typeof value === 'function') value = value(props);

                    result.push(value);
                }
                return result;
            }

            innerRender(contextTheme) {
                // eslint-disable-next-line
                const {props, $$ref, filtered} = this.props;

                // eslint-disable-next-line
                let localMixin = props.css;
                delete props.css;

                if (options.attrs) {
                    for (let attr in options.attrs) {
                        const value = options.attrs[attr];
                        props[attr] =
                            typeof value === 'function' ? value(props) : value;
                    }
                }
                props.theme = props.theme || contextTheme;
                const as = props.as || tag;
                const localValues = this.mapValues(props);

                let localWrapper = wrapper;

                if (localMixin) {
                    localWrapper = wrap(elementClassName, [...strs, '']);

                    while (typeof localMixin === 'function') {
                        localMixin = localMixin(props);
                    }

                    if (typeof localMixin === 'string') {
                        localMixin = css([localMixin]);
                    }

                    localValues.push(localMixin);
                }

                const args = [localWrapper];

                args.push.apply(args, localValues);

                props.ref = $$ref;

                return (options.styled || reshadowStyled).apply(null, args)(
                    'root__',
                    as,
                    props,
                    !isComponent && filtered,
                );
            }

            render() {
                return React.createElement(
                    ThemeConsumer,
                    null,
                    this.innerRender,
                );
            }
        }

        const WrappedComponent = React.forwardRef((currentProps, $$ref) => {
            const {props, filtered} = filterProps(currentProps);
            return React.createElement(StyledComponent, {
                props,
                $$ref,
                filtered,
            });
        });

        WrappedComponent.displayName = `styled.${element}`;

        WrappedComponent.withComponent = name =>
            createStyled(name)(strs, ...values);

        WrappedComponent.styledComponentId = 'id';

        return WrappedComponent;
    };

    const result = create();

    result.attrs = attrs => create({attrs});
    result.create = create;

    return result;
};

const styled = Base => createStyled(Base);

tags.forEach(tag => {
    styled[tag] = createStyled(tag);
});

export * from 'theming';
export {createGlobalStyle} from '@reshadow/styled/global';

export function isStyledComponent(target) {
    return target && typeof target.styledComponentId === 'string';
}

export {css, keyframes, ThemeConsumer};

export default styled;
