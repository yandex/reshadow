const ImportCollection = require('./ImportCollection');
const StylesProcessor = require('./StylesProcessor');

const defaultOptions = {
    defaultElement: 'div',
    postcss: true,
    files: /\.shadow\.css$/,
};

class Utils {
    constructor(p, state) {
        this.path = p;
        this.state = state;
        this.options = {...defaultOptions, ...state.opts};

        this.scope = {
            getName: name => (this.scope.has(name) ? `_${name}` : name),
            has: name => name in state.file.scope.bindings,
        };

        this.imports = new ImportCollection(this);
        this.stylesProcessor = new StylesProcessor(this);

        this.elements = new Map();
        this.setElement = (key, value) => {
            if (this.elements.has(key)) {
                this.elements.set(key, {
                    ...this.elements.get(key),
                    ...value,
                });
            } else {
                this.elements.set(key, value);
            }
        };
    }
}

module.exports = Utils;
