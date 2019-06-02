/**
 * @jest-environment enzyme
 */

import React from 'react';
import {render, shallow} from 'enzyme';

const getStyles = () =>
    [...document.getElementsByTagName('style')]
        .map(x => x.textContent)
        .join('');

let styled, ThemeProvider, css, createGlobalStyle;

describe('styled', () => {
    beforeEach(() => {
        [...document.getElementsByTagName('style')].forEach(x => {
            x.remove();
        });

        jest.isolateModules(() => {
            ({
                default: styled,
                ThemeProvider,
                css,
                createGlobalStyle,
            } = require('..'));
        });
    });

    it('should apply styles', () => {
        const Button = styled.button`
            color: red;
        `;

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply nested styles', () => {
        const Button = styled.button`
            color: red;

            & span {
                margin-right: 10px;
            }
        `;

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should process only namespaced attributes', () => {
        const Button = styled.button`
            color: red;

            &[use|size='m'] {
                font-size: 14px;
            }

            &[|size='s'] {
                font-size: 14px;
            }

            &[disabled] {
                opacity: 0.5;
            }
        `;

        Button.defaultProps = {size: 'm'};

        const wrapper = shallow(<Button>click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({size: 's'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply styles for Component', () => {
        const Button = styled(props => <button {...props} />)`
            color: red;
        `;

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply dynamic styles', () => {
        const Button = styled.button`
            color: ${props => props.color};
        `;

        const wrapper = render(<Button color="red">click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with attrs', () => {
        const Button = styled.button.attrs({
            type: 'submit',
            name: props => props.color,
        })`
            color: ${props => props.color};
        `;

        const wrapper = render(<Button color="red">click me</Button>);
        expect(wrapper).toMatchSnapshot();
    });

    it('should work with as', () => {
        const Button = styled.button`
            color: ${props => props.color};
        `;

        const wrapper = render(
            <Button as="a" href="#" color="red">
                click me
            </Button>,
        );
        expect(wrapper).toMatchSnapshot();
    });

    it('should work with theme', () => {
        const Button = styled.button`
            color: ${props => props.theme.color};
        `;

        const theme = {
            color: 'red',
        };

        const wrapper = render(
            <ThemeProvider theme={theme}>
                <Button>click me</Button>
            </ThemeProvider>,
        );
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with css prop', () => {
        const Button = styled.button`
            color: ${props => props.color};
        `;

        const wrapper = render(
            <Button
                color="red"
                css={`
                    padding: 5px 10px;
                `}
            >
                click me
            </Button>,
        );

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with css prop function', () => {
        const Button = styled.button`
            color: ${props => props.color};
        `;

        const wrapper = render(
            <Button
                color="red"
                top={5}
                css={props => `
                    padding: ${props.top}px 10px;
                `}
            >
                click me
            </Button>,
        );

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with css prop with tagged literal', () => {
        const Button = styled.button`
            color: ${props => props.color};
        `;

        const wrapper = render(
            <Button
                color="red"
                top={5}
                css={css`
                    padding: 5px 10px;
                `}
            >
                click me
            </Button>,
        );

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with mixins', () => {
        const padding = css`
            padding: 10px;
        `;

        const after = css`
            &::after {
                content: '';
            }
        `;

        const before = css`
            ::before {
                content: '';
            }
        `;

        const Button = styled.button`
            ${padding}
            ${after}
            ${before}
            color: ${props => props.color};
        `;

        const wrapper = render(<Button color="red">click me</Button>);

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with string mixins', () => {
        const padding = `
            padding: 10px;
        `;

        const Button = styled.button`
            ${padding}
        `;

        const wrapper = render(<Button width={100}>click me</Button>);

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with dynamic mixins', () => {
        const dynamicMixin = ({width}) =>
            css`
                transform: translateX(${({width}) => `-${2 * width}`}px);
                margin: ${width}px;
            `;

        const Button = styled.button`
            ${dynamicMixin}
        `;

        const wrapper = shallow(<Button width={0}>click me</Button>);

        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({width: 100});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should deal with specificity', () => {
        const style = css`
            flex: 1;
        `;

        const Wrap = styled(({start, end, max, ...props}) => <h4 {...props} />)`
            :after {
                ${style};
                flex: ${({start}) => start && '20'};
            }
            :before {
                ${style};
                flex: ${({end}) => end && '20'};
            }
        `;

        const wrapper = render(
            <Wrap start end>
                title
            </Wrap>,
        );

        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should work with nested mixins', () => {
        const complexMixin = css`
            color: ${props => (props.whiteColor ? 'white' : 'black')};
        `;

        const Button = styled.button`
            ${props => (props.complex ? complexMixin : 'color: blue;')};
        `;

        const wrapper = shallow(<Button complex>click me</Button>);

        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({whiteColor: true});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({complex: false});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should create global style', () => {
        const GlobalStyle = createGlobalStyle`
            body {
                color: ${props => (props.whiteColor ? 'white' : 'black')};
            }
        `;

        const wrapper = shallow(<GlobalStyle whiteColor />);

        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });
});
