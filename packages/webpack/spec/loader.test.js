import compiler from './compiler.js';

describe('webpack', () => {
    it('inserts name and outputs JavaScript', async () => {
        const entry = './App/index.js';

        const {stats} = await compiler(entry);
        const output = stats.toJson();

        if (output.errors.length) {
            output.errors.forEach(console.error);

            throw new Error('there are some errors in compilation');
        }

        const appModule = output.modules.find(x => x.name === entry);

        expect(appModule.source).toMatchSnapshot();
        expect(
            stats.compilation.assets['styles.css'].source().toString(),
        ).toMatchSnapshot();
    });
});
