type CustomElement<T = 'div'> = T extends any
  ? ({ as?: T } & JSX.IntrinsicElements[T])
  : never;

declare namespace JSX {
  interface IntrinsicElements extends JSX.IntrinsicElements {
    [name: string]: CustomElement<keyof JSX.IntrinsicElements>;
  }
}
