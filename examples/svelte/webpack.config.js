const postcss = require('postcss');
const {stripIndent} = require('common-tags');
const reshadow = require('../../src/postcss');
const processor = postcss([reshadow({})]);

const {transformAsync} = require('@babel/core');

const preprocess = {
    style: async ({content, attributes, filename}) => {
        if (!attributes.reshadow) return {code: content};

        return {
            code: await processor.process(stripIndent(content), {
                from: filename,
            }),
        };
    },
    // script: ({content, filename}) => {
    //     return {
    //         code: content.replace(
    //             /styled\((.*)\)/,
    //             `const _styles = create([$1]);`,
    //         ),
    //     };
    // },
    markup: async ({content, filename}) => {
        let script = '';
        let scriptAttrs = '';
        let style = '';
        let styleAttrs = '';

        const placeholders = [];

        if (!content.includes('reshadow')) {
            return {code: content};
        }

        let code = content
            .replace(/<script(.*?)>(.*?)<\/script>/ms, (match, v1, v2) => {
                scriptAttrs = v1;
                script = v2;
                return '';
            })
            .replace(/<style.*?>(.*?)<\/style>/ms, (match, v1, v2) => {
                styleAttrs = v1;
                style = v2;
                return '';
            })
            .replace(/(<|\s):\{(.*?)\}/gms, '$1use:$2={$2}')
            .replace(/(<|\s)(_|:|\|)/gms, '$1use:')
            .replace(/\{(.*?)\}/gms, (match, value) => {
                const index = placeholders.length;
                placeholders.push(value);
                return `{__PLACEHOLDER__${index}__}`;
            })
            .replace(
                /<(\w+)(([\r\n\s]+)(([:\w]+=)?\{\w+\}|[:\w]+=['"].*?['"]|[:\w]+=\w+))+>/gms,
                (match, tag, between, prop, offset, original) => {
                    return match
                        .replace(
                            /([^=])\{(\w+)\}/gms,
                            (match, $1, $2) => `${$1}${$2}={${$2}}`,
                        )
                        .replace(
                            /([:\w]+)=(\w+)/gms,
                            (match, $1, $2) => `${$1}="${$2}"`,
                        );
                },
            );

        let reshadowImport = '';
        let styledName = '';
        let styled = '';
        script = script
            .replace(
                new RegExp(`import.*?(\\w+).*?from.*?['"]reshadow['"];?`, 'ms'),
                (match, value) => {
                    reshadowImport = match;
                    styledName = value;
                    return '';
                },
            )
            .replace(
                new RegExp(`${styledName}(\\(.*?\\).*[^)])?(\`(.*?)\`)?`, 'ms'),
                match => {
                    styled = match.replace(/;[^\w]$/, '') + `(<>${code}</>);`;
                    return '';
                },
            );

        code = `${reshadowImport}${styledName}.classProp="class";${styled}`;

        // console.log({code});

        ({code} = await transformAsync(code, {
            filename,
            babelrc: false,
            configFile: false,
            plugins: [
                [
                    require.resolve('../../src/babel'),
                    {
                        postcss: true,
                        stringStyle: true,
                        ignoreProp: name => /^(on:)/.test(name),
                    },
                ],
            ],
        }));

        let markup = '';
        code = code
            .replace(/<>(.*?)<\/>/ms, (match, value) => {
                markup = value.replace(/className=/gms, 'class=');
                return 'null';
            })
            .replace(`${styledName}(`, '(');

        markup = markup.replace(/__PLACEHOLDER__(\d+)__/gms, (match, value) => {
            return placeholders[value];
        });

        // console.log({code, markup});

        return {
            code: `<script${scriptAttrs}>${script}${code}</script><style${styleAttrs}>${style}</style>${markup}`,
        };
    },
};

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
    mode,
    entry: ['./src/index.js'],
    resolve: {
        alias: {
            reshadow: require.resolve('../../src'),
        },
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
                        preprocess,
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
