import styled, {css, jsx, getDisplayName} from './';
import tags from '@reshadow/utils/html-tags';

const wrap = (element, arr) => {
    arr[0] = `${element} {` + arr[0];
    arr[arr.length - 1] = arr[arr.length - 1] + '}';
    return arr;
};

const createStyled = tag => (strs, ...values) => {
    const element = typeof tag === 'function' ? getDisplayName(tag) : tag;
    const wrapper = wrap(element, [...strs]);
    const newStrs = Object.create(wrapper);
    newStrs.raw = newStrs;

    return props => styled(
        newStrs,
        ...values.map(x => (typeof x === 'function' ? x(props) : x)),
    )(jsx(tag, props));
};

const fn = Base => createStyled(Base);

tags.forEach(tag => {
    fn[tag] = createStyled(tag);
});

export {css};

export default fn;
