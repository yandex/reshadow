import {USE_PREFIX} from '@reshadow/core';
import stylis from 'stylis';

stylis.set({cascade: false});

const parse = (code, hash, options = {}) => {
    stylis.set(options);

    const tokens = {};
    const postfix = '_' + hash;
    const len = postfix.length;
    stylis.use(null)((context, content, selectors) => {
        if (context !== 2) {
            return;
        }

        for (let i = 0; i < selectors.length; i++) {
            if (selectors[i] === 'from' || selectors[i] === 'to') {
                continue;
            }
            const currHash = selectors[i].slice(-len);
            if (currHash === postfix) {
                selectors[i] = selectors[i].slice(0, -len);
            }
            selectors[i] = selectors[i].replace(
                /\[(.*?)\]|([#.:]?\w+)/g,
                (match, $1, $2) => {
                    let className = '';

                    if ($2) {
                        if ($2[0] === '.' || $2[0] === ':' || $2[0] === '#') {
                            return $2;
                        }
                        const currHash = $2.slice(-len);
                        if (currHash === postfix) {
                            $2 = $2.slice(0, -len);
                        }
                        className = '__' + $2;
                    } else {
                        const attr = $1.replace(/[\s\n\r'"]/g, '').split('=');
                        let name = attr[0];
                        const value = attr[1];

                        if (name[0] === '|') {
                            name = USE_PREFIX + name.slice(1);
                        }

                        if (value) {
                            className = '_' + name + '_' + value;
                        } else {
                            className = '_' + name;
                        }
                    }

                    tokens[className] = className + postfix;
                    return '.' + tokens[className];
                },
            );
        }
    });

    const result = stylis('_' + hash, code);

    return {css: result, tokens};
};

export default parse;
