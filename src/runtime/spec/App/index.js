import React from 'react';
import styled, {use} from 'reshadow';

import styles from './styles';
import styles2 from './styles2';

const App = ({disabled, type, color = 'grey'}) =>
    styled(styles)`
        button[disabled] {
            color: ${color};
        }
    `(
        <button type={type} disabled={disabled} use:theme="normal">
            {styled(styles2)(<use:content>content</use:content>)}

            <use:control>click</use:control>
        </button>,
    );

export default App;
