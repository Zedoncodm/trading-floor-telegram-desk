declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace React {
  export type FC<P = {}> = (props: P) => any;
  export type ReactNode = any;
  export type ChangeEvent<T = any> = {
    target: T;
  };
}

declare module "react" {
  export = React;
}
