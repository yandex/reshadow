import {USE_PREFIX} from '@reshadow/core';
import Stylis from '@emotion/stylis';

const __root__ = '__root__';

const stylis = new Stylis();

const parse = (
    code,
    hash,
    {isMixin, elements, attributes, onlyNamespaced, classes},
) => {
    const options = {
        prefix: !isMixin,
    };

    stylis.set(options);

    const tokens = Object.create(null);
    const postfix = '_' + hash;

    const rules = Object.create(null);

    let skip = false;

    stylis.use(null)(function(
        context,
        content,
        selectors,
        parent,
        line,
        column,
    ) {
        if (skip) return;

        if (context === -2) {
            skip = true;

            let result = '';
            for (let selector in rules) {
                result += selector + '{' + rules[selector] + '}';
            }
            return result;
        }

        if (context === 3) {
            for (let i = 0; i < selectors.length; i++) {
                rules[selectors[i]] = content;
            }
        }

        if (context !== 2) {
            return;
        }

        for (let i = 0; i < selectors.length; i++) {
            let selector = selectors[i];

            if (
                selector === 'from' ||
                selector === 'to' ||
                selector[selector.length - 1] === '%'
            ) {
                continue;
            }

            selectors[i] = selector.replace(
                /:global\((.*?)\)|\[(.*?)\]|([#.:]?\w+)/g,
                (match, $0, $1, $2) => {
                    let className = '';

                    if ($0) {
                        return $0;
                    }

                    if ($2) {
                        if ($2[0] === ':' || $2[0] === '#') {
                            return $2;
                        }

                        if ($2[0] === '.') {
                            className = $2.slice(1);

                            let isRoot = false;
                            className = className.replace(__root__, () => {
                                isRoot = true;
                                return postfix;
                            });

                            if (isRoot) {
                                tokens[__root__] = className;
                                return '.' + className;
                            }

                            if (!classes) {
                                tokens[className] = className;
                                return '.' + className;
                            }
                        } else if (elements) {
                            className = '__' + $2;
                        }
                    } else if ($1 && attributes) {
                        const attr = $1.replace(/[\s\n\r'"]/g, '').split('=');
                        let name = attr[0];
                        const value = attr[1];

                        if (name[0] === '|') {
                            name = USE_PREFIX + name.slice(1);
                        } else if (name.slice(0, 4) === 'use|') {
                            name = USE_PREFIX + name.slice(4);
                        } else if (onlyNamespaced) {
                            return match;
                        }

                        if (value) {
                            className = '_' + name + '_' + value;
                        } else {
                            className = '_' + name;
                        }
                    }

                    if (!className) return match;

                    tokens[className] = className + postfix;
                    return '.' + tokens[className];
                },
            );

            rules[selectors[i]] = rules[selectors[i]] || '';
            rules[selectors[i]] += content;
        }
    });

    const result = stylis(isMixin ? '&' : '', code);

    return {css: result, tokens};
};

export default parse;
