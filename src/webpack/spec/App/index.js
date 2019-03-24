import React from 'react';
import styled from 'reshadow';

const App = ({disabled, type, color = 'grey'}) => styled`
    button[disabled] {
        color: ${color};
    }
`(
    <button type={type} disabled={disabled} use:theme="normal">
        <control>click</control>
    </button>,
);

export default App;
