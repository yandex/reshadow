const t = require('@babel/types');

const getName = node => {
    if (t.isJSXNamespacedName(node))
        return [getName(node.namespace), getName(node.name)].join(':');

    if (t.isJSXIdentifier(node)) return node.name;

    if (t.isJSXMemberExpression(node)) {
        return [getName(node.object), getName(node.property)].join('.');
    }

    return '';
};

const getAttrValue = node =>
    (t.isJSXExpressionContainer(node) ? node.expression : node) ||
    t.booleanLiteral(true);

const getAttrName = node => {
    const propName = getName(node);

    return /^[$0-9a-z_]+$/i.test(propName)
        ? t.identifier(propName)
        : t.stringLiteral(propName);
};

/**
 * Basic React.Fragment check
 * We can improve it by checking import aliases if needs
 */
const isReactFragment = node => {
    if (!node) return false;

    if (t.isJSXFragment(node)) return true;

    const [element] = node.arguments || [];

    if (t.isIdentifier(element)) return element.name === 'Fragment';

    if (t.isMemberExpression(element)) {
        return (
            element.object.name === 'React' &&
            element.property.name === 'Fragment'
        );
    }

    return false;
};

module.exports = {
    getName,
    getAttrValue,
    getAttrName,
    isReactFragment,
};
