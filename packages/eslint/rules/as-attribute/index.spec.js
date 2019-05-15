import {RuleTester} from 'eslint';

import rule from '.';

const parserOptions = {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true,
    },
};

const ruleTester = new RuleTester({parserOptions});

ruleTester.run('as-attribute', rule, {
    valid: [
        {
            code: '<button />',
        },
        {
            code: '<myelement as="div" />',
        },
        {
            code: '<myelement />',
        },
        {
            code: '<myelement as="myelement" />',
            options: [{onlyExisting: false}],
        },
        {
            code: '<myelement as={as} />',
            options: [{always: true}],
        },
    ],
    invalid: [
        {
            code: '<myelement />',
            options: [{always: true}],
            errors: [{message: 'Nonexistent tag should have `as` attribute'}],
        },
        {
            code: '<myelement as={as} />',
            options: [{onlyString: true}],
            errors: [{message: '`as` attribute should be the static string'}],
        },
        {
            code: '<myelement as="myelement" />',
            options: [{onlyExisting: true}],
            errors: [{message: 'Nonexistent html tag'}],
        },
        {
            code: '<myelement as={`myelement`} />',
            options: [{onlyExisting: true}],
            errors: [{message: 'Nonexistent html tag'}],
        },
    ],
});
