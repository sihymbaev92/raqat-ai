declare module "react-test-renderer" {
  import type { ReactElement } from "react";

  export type ReactTestInstance = {
    props: Record<string, unknown>;
    findByProps: (props: Record<string, unknown>) => ReactTestInstance;
  };

  export type ReactTestRenderer = {
    toJSON: () => unknown;
    root: ReactTestInstance;
    unmount: () => void;
  };

  export function act(callback: () => void | Promise<void>): void | Promise<void>;

  export function create(element: ReactElement): ReactTestRenderer;

  const defaultExport: {
    create: typeof create;
  };

  export default defaultExport;
}
