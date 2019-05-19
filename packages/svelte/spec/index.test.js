const {stripIndent} = require('common-tags');

const reshadow = require('../preprocess');

const createTransform = (options = {}) => {
    const processor = reshadow(options);

    return content => processor.markup({content: stripIndent(content)});
};

const transform = createTransform();

describe('svelte preprocess', () => {
    it('should transform the code', () => {
        const code = transform`
            <script>
                import styled from 'reshadow'

                export let disabled = false
                export let size = 'm'

                styled\`
                    h1 {
                        color: \${color\};
                    }
                \`
            </script>

            <svelte:body on:click={() => console.log('body click')} />

            <h1>hello world</h1>

            <button :variant="action" :{size} {disabled}>click me</button>
        `;

        expect(code).toMatchSnapshot();
    });
});
