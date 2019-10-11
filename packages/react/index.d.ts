import { createElement, Component } from 'react';

declare function id<A extends JSX.Element>(node: A): A;

declare function taggedStyled(
  strs: TemplateStringsArray,
  ...values: (string | number)[]
): typeof id;
declare function taggedStyled<A extends JSX.Element>(node: A): A;

declare function styled<S extends { [key: string]: string }>(
  ...styles: S[]
): typeof taggedStyled;
declare function styled(
  strs: TemplateStringsArray,
  ...values: (string | number)[]
): typeof id;

export declare var use: (<S extends { [key: string]: any }>(value: S) => {}) & {
  [key: string]: typeof Component;
};

export declare function css(
  strs: TemplateStringsArray,
  ...values: any[]
): { [key: string]: string };
export declare function keyframes(
  strs: TemplateStringsArray,
  ...values: (string | number)[]
): string;

declare var jsx: typeof createElement;

export default styled;
