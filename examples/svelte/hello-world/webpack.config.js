const reshadow = require('@reshadow/svelte/preprocess');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
    mode,
    entry: ['./src/index.js'],
    resolve: {
        extensions: ['.mjs', '.js', '.svelte'],
    },
    output: {
        path: `${__dirname}/public`,
        filename: '[name].js',
        chunkFilename: '[name].[id].js',
    },
    module: {
        rules: [
            {
                test: /\.svelte$/,
                exclude: /node_modules/,
                use: {
                    loader: 'svelte-loader',
                    options: {
                        hotReload: !prod,
                        preprocess: reshadow(),
                    },
                },
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            hmr: !prod,
                        },
                    },
                    {
                        loader: 'css-loader',
                        options: {modules: true, importLoaders: 1},
                    },
                    'postcss-loader',
                ],
            },
        ],
    },
    devtool: prod ? false : 'source-map',
};
