/**
 * @jest-environment enzyme
 */

import React from 'react';
import App from './App';
import {render} from 'enzyme';

describe('babel', () => {
    it('should transform the code', () => {
        const wrapper = render(<App />);
        expect(wrapper).toMatchSnapshot();
    });

    it('should transform the code', () => {
        const wrapper = render(<App disabled type="submit" />);
        expect(wrapper).toMatchSnapshot();
    });
});
