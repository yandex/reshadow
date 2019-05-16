import styled, {
    map as _map,
    css,
    create,
    set,
    __css__,
    KEYS,
} from '@reshadow/core';

KEYS.__classProp__ = 'class';

const map = (element, data) => {
    if (!data.attrs) return data;
    data.attrs.class = data.class;
    data.attrs.style = data.style;
    data.attrs = _map(element, data.attrs);
    data.class = data.attrs.class;
    data.style = data.attrs.style;
    delete data.attrs.class;
    delete data.attrs.style;
    return data;
};

const use = obj => {
    const result = {attrs: {}};
    result.attrs[KEYS.__use__] = obj;
    return result;
};

export {use, css, create, set, map, __css__};

export default styled;
