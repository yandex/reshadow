/**
 * @jest-environment enzyme
 */

const getStyles = () =>
    [...document.getElementsByTagName('style')]
        .map(x => x.textContent)
        .join('');

let keyframes;
let css;

describe('runtime', () => {
    beforeEach(() => {
        [...document.getElementsByTagName('style')].forEach(x => {
            x.remove();
        });

        jest.isolateModules(() => {
            ({keyframes, css} = require('..'));
        });
    });

    it('should work with keyframes', () => {
        const pulse = keyframes`
            0%, 25% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        `;

        expect(pulse).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should use dynamic variables fallback', () => {
        css.setOptions({variablesFallback: true});

        css`
            button {
                color: ${'red'};
            }
        `;

        expect(getStyles()).toMatchSnapshot();
    });
});
