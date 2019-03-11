import path from 'path';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';

export default (entry, options = {}) => {
    const compiler = webpack({
        entry,
        output: {
            filename: '[name].js',
        },
        context: __dirname,
        mode: 'none',
        plugins: [
            new webpack.IgnorePlugin({
                checkResource(resource) {
                    return !(resource === entry || resource.endsWith('.css'));
                },
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: 'styles.css',
                            },
                        },
                        'extract-loader',
                        'css-loader',
                    ],
                },
                {
                    test: /\.js$/,
                    include: [__dirname],
                    use: [
                        path.resolve(__dirname, '../loader.js'),
                        'babel-loader',
                    ],
                },
            ],
        },
        resolve: {
            modules: ['node_modules', path.resolve(__dirname, '../../')],
        },
        optimization: {
            splitChunks: {
                chunks(chunk) {
                    console.log({chunk});
                    // exclude `my-excluded-chunk`
                    return chunk.name !== 'my-excluded-chunk';
                },
            },
        },
    });

    compiler.outputFileSystem = new MemoryFS();

    return new Promise((resolve, reject) => {
        compiler.run((error, stats) => {
            if (error) {
                reject(new Error(error));
            }

            resolve({stats, compiler});
        });
    });
};
