// eslint-disable-next-line @typescript-eslint/no-unused-vars
type GetClassMethodParams<T> = T extends new (...args: any) => infer T
  ? {
      [K in keyof T]: T[K] extends (...args: infer P) => any ? P : never;
    }
  : never;
