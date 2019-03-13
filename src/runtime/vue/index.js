const {map: _map, ...rest} = require('..');

rest.default.classProp = 'class';

function map(element, data) {
    if (!data.attrs) return data;
    data.attrs.class = data.class;
    data.attrs = _map(element, data.attrs);
    data.class = data.attrs.class;
    delete data.attrs.class;
    return data;
}

module.exports = rest;
module.exports.map = map;
