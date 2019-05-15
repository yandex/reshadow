const {createMacro} = require('babel-plugin-macros');

const createPlugin = require('@reshadow/babel');

const configName = 'reshadow';

const plugins = new Map();

const defaultConfig = {
    postcss: true,
    files: /\.shadow\.css$/,
};

module.exports = createMacro(
    ({references, state, babel, config = {}, source}) => {
        if (!plugins.has(config)) {
            const pluginConfig = Object.assign(defaultConfig, config, {source});

            plugins.set(config, createPlugin(babel, pluginConfig));
        }

        const plugin = plugins.get(config);
        const program = state.file.path;

        plugin.visitor.Program.enter(program, state);

        program.traverse(plugin.visitor);

        return {
            keepImports: true,
        };
    },
    {
        configName,
    },
);
