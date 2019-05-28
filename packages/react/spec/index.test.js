/**
 * @jest-environment enzyme
 */

/** @jsx jsx */
import styled, {css, jsx} from '..';
import {render, shallow} from 'enzyme';

const getStyles = () =>
    [...document.getElementsByTagName('style')]
        .map(x => x.textContent)
        .join('');

describe('react', () => {
    it('should apply styles', () => {
        const Button = ({children, ...props}) => styled`
            button {
                color: red;
            }
        `(<button>{children}</button>);

        const wrapper = render(<Button>click me</Button>);
        expect(wrapper).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });

    it('should apply dynamic styles', () => {
        const Button = ({children, color, ...props}) => styled`
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

        const Button = ({children, color, ...props}) => styled(styles)(
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

        const Button = ({children, color, ...props}) => styled(styles({color}))(
            <button>{children}</button>,
        );

        const wrapper = shallow(<Button color="red">click me</Button>);
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();

        wrapper.setProps({color: 'green'});
        expect(wrapper.render()).toMatchSnapshot();
        expect(getStyles()).toMatchSnapshot();
    });
});
