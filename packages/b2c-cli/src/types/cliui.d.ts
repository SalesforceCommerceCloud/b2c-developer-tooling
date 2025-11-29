declare module 'cliui' {
  interface Column {
    text: string;
    width?: number;
    align?: 'center' | 'left' | 'right';
    padding?: [number, number, number, number];
    border?: boolean;
  }

  interface UIOptions {
    width?: number;
    wrap?: boolean;
  }

  interface UI {
    div(...columns: (Column | string)[]): void;
    span(...columns: (Column | string)[]): void;
    resetOutput(): void;
    toString(): string;
  }

  function cliui(options?: UIOptions): UI;
  export default cliui;
}
