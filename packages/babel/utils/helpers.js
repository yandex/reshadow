const t = require('@babel/types');

const toObjectExpression = obj =>
    t.objectExpression(
        Object.entries(obj).map(([key, value]) =>
            t.objectProperty(
                t.stringLiteral(key),
                t.templateLiteral(
                    [
                        t.templateElement({
                            raw: value,
                            cooked: value,
                        }),
                    ],
                    [],
                ),
            ),
        ),
    );

module.exports = {toObjectExpression};
