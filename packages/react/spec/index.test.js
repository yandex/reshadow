/**
 * @jest-environment enzyme
 */

import {render, shallow} from 'enzyme';

const getStyles = () =>
    [...document.getElementsByTagName('style')]
        .map(x => x.textContent)
        .join('');

/** @jsx jsx */
let styled, css, jsx;

describe('react', () => {
    beforeEach(() => {
        [...document.getElementsByTagName('style')].forEach(x => {
            x.remove();
        });

        jest.isolateModules(() => {
            ({default: styled, css, jsx} = require('..'));
        });
    });

    it('should apply styles', () => {
        const Button = ({children}) => styled`
            button {
                color: red;
            }
        `(<button>{children}</button>);

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply dynamic styles', () => {
        const Button = ({children, color}) => styled`
            button {
                color: ${color};
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({color: 'green'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply external styles', () => {
        const styles = css`
            button {
                color: red;
            }
        `;

        const Button = ({children}) => styled(styles)(
            <button>{children}</button>,
        );

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply external dynamic styles', () => {
        const styles = ({color}) => css`
            button {
                color: ${color};
            }
        `;

        const Button = ({children, color}) => styled(styles({color}))(
            <button>{children}</button>,
        );

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({color: 'green'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply global styles', () => {
        const styles = ({color}) => css`
            :global(button) + :global(button) {
                color: ${color};
            }
        `;

        const Button = ({children, color}) => styled(styles({color}))(
            <button>{children}</button>,
        );

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply mixins', () => {
        const theme = css`
            color: red;
            border: none;
        `;

        const Button = ({children}) => styled`
            button {
                ${theme}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button>click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply mixins with pseudo', () => {
        const theme = css`
            color: red;
            border: none;
            &:focus {
                color: green;
            }
        `;

        const Button = ({children}) => styled`
            button {
                ${theme}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button>click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply dynamic mixins', () => {
        const theme = ({color}) => css`
            color: ${color};
            border: none;
        `;

        const Button = ({children, color}) => styled`
            button {
                ${theme({color})}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({color: 'green'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply conditional mixins', () => {
        const theme = ({variant, color}) =>
            variant === 'inverse'
                ? css`
                      color: ${color};
                      background: white;
                  `
                : css`
                      color: white;
                      background: ${color};
                  `;

        const Button = ({children, variant, color}) => styled`
            button {
                ${theme({color, variant})}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(
            <Button variant="normal" color="red">
                click me
            </Button>,
        );
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({color: 'green', variant: 'inverse'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply composed mixins', () => {
        const padding = css`
            padding: 5px 10px;
        `;

        const theme = ({color}) => css`
            color: ${color};
            ${padding}
        `;

        const Button = ({children, color}) => styled`
            button {
                ${theme({color})}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply object mixins', () => {
        const padding = {
            padding: '5px 10px',
        };

        const Button = ({children}) => styled`
            button {
                ${padding}
                margin: 10px;
            }
        `(<button>{children}</button>);

        const wrapper = shallow(<Button>click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with Fragments', () => {
        const Button = ({children}) => styled`
            button {
                margin: 10px;
            }
        `(
            <>
                <button>{children}</button>
            </>,
        );

        const wrapper = shallow(<Button>click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });
});
