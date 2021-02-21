/* eslint-disable typescript-eslint/no-explicit-any */
declare namespace jest {
  interface Matchers<R> {
    toMatchSchema(schema: any): R;
  }
}
