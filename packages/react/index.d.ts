import {createElement} from 'react';

declare function id<A extends JSX.Element>(node: A): A;

declare function taggedStyled(
    strs: TemplateStringsArray,
    ...values: any[]
): typeof id;
declare function taggedStyled<A extends JSX.Element>(node: A): A;

declare function styled<S extends {[key: string]: string}>(
    ...styles: S[]
): typeof taggedStyled;
declare function styled(
    strs: TemplateStringsArray,
    ...values: any[]
): typeof id;

export function use<S extends {[key: string]: any}>(value: S): {};

export function css(
    strs: TemplateStringsArray,
    ...values: any[]
): {[key: string]: string};
export function keyframes(strs: TemplateStringsArray, ...values: any[]): string;

declare var jsx: typeof createElement;

export default styled;
