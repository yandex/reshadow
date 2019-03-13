import styled, {map as _map, use, css, create, set, __css__} from '..';

styled.classProp = 'class';

function map(element, data) {
    if (!data.attrs) return data;
    data.attrs.class = data.class;
    data.attrs.style = data.style;
    data.attrs = _map(element, data.attrs);
    data.class = data.attrs.class;
    data.style = data.attrs.style;
    delete data.attrs.class;
    delete data.attrs.style;
    return data;
}

export {use, css, create, set, map, __css__};

export default styled;
