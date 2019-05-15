import React from 'react';
import {render} from 'react-dom';
import styled from 'reshadow';

import styles from './styles.css';

const Button = props => styled(styles)`
    button {
        background: white;
        border: 1px solid;
        border-radius: 4px;
        color: red;
    }
`(<button {...props} />);

const App = () => <Button>Hello!</Button>;

render(<App />, document.getElementById('app'));
